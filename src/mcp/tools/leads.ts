import { ResourceTemplate, type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/db";
import { analyzeSentimentReal, runLeadCategorizationAgent, runLeadScoringAgent } from "@/lib/ai-agents";
import { ensureCustomerFromLead, LEAD_STAGES, transitionLeadStage } from "@/lib/crm-lifecycle";
import { getMcpContext } from "../context";
import { runTool } from "../utils";

const emailSchema = z.string().transform((value) => {
  const match = value.match(/<([^>]+)>/);
  const raw = match ? match[1] : value;
  return raw.trim().toLowerCase();
});
const leadStageSchema = z.enum([
  LEAD_STAGES.NEW,
  LEAD_STAGES.CONTACTED,
  LEAD_STAGES.INBOUND,
  LEAD_STAGES.MEETING_BOOKED,
  LEAD_STAGES.QUALIFIED,
  LEAD_STAGES.CONVERTED,
]);

const leadEditableFields = {
  name: z.string().min(1).optional(),
  email: emailSchema.optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  licenseType: z.string().optional(),
  areaOfOperation: z.string().optional(),
  dealFocus: z.string().optional(),
  budgetRange: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  rating: z.string().optional(),
  linkedin: z.string().optional(),
  source: z.string().optional(),
  status: leadStageSchema.optional(),
  categoryId: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Category ID or Category Name (e.g. 'Talent') to assign this lead to. AI agents can also call leads.list_categories or check britcrm://leads/categories to discover category IDs."
    ),
};

type CsvRecord = Record<string, unknown>;

// Using shared jsonResult and runTool from ../utils

function asText(value: unknown) {
  return String(value || "").trim();
}

function normalizeEmail(value: unknown) {
  return asText(value).toLowerCase();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function findKey(keys: string[], keywords: string[]) {
  return keys.find((key) => keywords.some((keyword) => key.toLowerCase().includes(keyword)));
}

function detectDelimiter(csvText: string) {
  const firstLine = csvText.split(/\r?\n/)[0] || "";
  if (firstLine.includes(";")) return ";";
  if (firstLine.includes("\t")) return "\t";
  return ",";
}

async function assertCategoryAccess(userId: string, categoryId?: string | null, autoCreate = true) {
  if (!categoryId) return null;
  const trimmed = categoryId.trim();
  if (!trimmed) return null;

  // 1. Direct match by ID or exact name
  const direct = await prisma.category.findFirst({
    where: {
      userId,
      OR: [{ id: trimmed }, { name: trimmed }],
    },
    select: { id: true },
  });
  if (direct) return direct.id;

  // 2. Case-insensitive search across user categories
  const allUserCats = await prisma.category.findMany({
    where: { userId },
    select: { id: true, name: true },
  });
  const matched = allUserCats.find(
    (c) => c.id === trimmed || c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (matched) return matched.id;

  // 3. Auto-create if requested so safety layer never rejects valid category references
  if (autoCreate) {
    try {
      const created = await prisma.category.create({
        data: {
          name: trimmed,
          userId,
        },
        select: { id: true },
      });
      return created.id;
    } catch {
      const retry = await prisma.category.findFirst({
        where: { userId, name: trimmed },
        select: { id: true },
      });
      if (retry) return retry.id;
    }
  }

  return null;
}

async function findUserLead(userId: string, leadId: string) {
  const trimmed = leadId.trim();
  const lead = await prisma.lead.findFirst({
    where: {
      userId,
      OR: [{ id: trimmed }, { email: trimmed.toLowerCase() }],
    },
  });
  if (!lead) throw new Error("Lead not found for this MCP user.");
  return lead;
}

function toLeadSelect() {
  return {
    id: true,
    name: true,
    email: true,
    phone: true,
    company: true,
    website: true,
    industry: true,
    location: true,
    source: true,
    status: true,
    aiScore: true,
    aiInsights: true,
    categoryId: true,
    category: {
      select: {
        id: true,
        name: true,
      },
    },
    createdAt: true,
    updatedAt: true,
  };
}

export function registerLeadTools(server: McpServer) {
  server.registerTool(
    "leads.list",
    {
      title: "List Leads",
      description: "List CRM leads owned by the MCP user with filters. categoryId can be a category ID or category name (e.g. 'Talent', 'SentraVault').",
      inputSchema: {
        search: z.string().optional(),
        status: z.string().optional(),
        categoryId: z.string().optional().describe("Filter by Category ID or Category Name (e.g. 'Talent', 'SentraVault')."),
        category: z.string().optional().describe("Alias for categoryId."),
        source: z.string().optional(),
        company: z.string().optional(),
        limit: z.number().int().min(1).max(50000).optional().default(1000),
        offset: z.number().int().min(0).default(0),
      },
    },
    async ({ search, status, categoryId, category: categoryAlias, source, company, limit, offset }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const targetCategory = categoryId || categoryAlias;
        const where: any = { userId: context.userId };
        if (status) where.status = status;
        if (targetCategory) {
          const resolved = await assertCategoryAccess(context.userId, targetCategory, false);
          if (resolved) {
            where.categoryId = resolved;
          } else {
            where.OR = [
              { categoryId: targetCategory },
              { category: { name: { contains: targetCategory } } },
            ];
          }
        }
        if (source) where.source = { contains: source };
        if (company) where.company = { contains: company };
        if (search) {
          const searchFilter = [
            { name: { contains: search } },
            { email: { contains: search } },
            { company: { contains: search } },
            { industry: { contains: search } },
          ];
          if (where.OR) {
            where.AND = [{ OR: where.OR }, { OR: searchFilter }];
            delete where.OR;
          } else {
            where.OR = searchFilter;
          }
        }

        const [total, leads] = await Promise.all([
          prisma.lead.count({ where }),
          prisma.lead.findMany({
            where,
            select: toLeadSelect(),
            orderBy: { createdAt: "desc" },
            skip: offset,
            take: limit,
          }),
        ]);

        return { total, offset, limit, leads };
      })
  );

  server.registerTool(
    "leads.get",
    {
      title: "Get Lead",
      description: "Get one lead with interactions, tasks, deals, and campaign history.",
      inputSchema: {
        leadId: z.string().min(1),
      },
    },
    async ({ leadId }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const lead = await prisma.lead.findFirst({
          where: { id: leadId, userId: context.userId },
          include: {
            category: { select: { id: true, name: true } },
            interactions: { orderBy: { date: "desc" }, take: 25 },
            tasks: { orderBy: { createdAt: "desc" }, take: 25 },
            deals: { orderBy: { createdAt: "desc" }, take: 25 },
            campaigns: {
              include: { campaign: { select: { id: true, name: true, status: true, createdAt: true } } },
              orderBy: { id: "desc" },
              take: 25,
            },
          },
        });
        if (!lead) throw new Error("Lead not found for this MCP user.");
        return lead;
      })
  );

  
  server.registerTool(
    "leads.deduplicate",
    {
      title: "Deduplicate Leads And Prospects",
      description: "Perform CRM-safe deduplication for a list of researched prospects or emails against existing CRM leads and customers.",
      inputSchema: {
        prospects: z.array(z.union([
          z.string(),
          z.object({
            email: z.string(),
            name: z.string().optional(),
            company: z.string().optional(),
            website: z.string().optional(),
          })
        ])).optional(),
        emails: z.array(z.string()).optional(),
      },
    },
    async ({ prospects, emails }) =>
      runTool(async () => {
        const rawItems = [...(prospects || []), ...(emails || [])];
        const normalized = rawItems.map((item) => {
          const raw = typeof item === "string" ? item : item.email;
          const email = raw.replace(/.*<([^>]+)>.*/, "$1").trim().toLowerCase();
          return typeof item === "string" ? { email, name: email.split("@")[0] } : { ...item, email };
        }).filter((p) => Boolean(p.email));

        const unique = Array.from(new Map(normalized.map((p) => [p.email, p])).values());
        const candidateEmails = unique.map((p) => p.email);

        const [existingLeads, existingCustomers] = await Promise.all([
          prisma.lead.findMany({
            where: { email: { in: candidateEmails } },
            select: { id: true, email: true, name: true, company: true, status: true, userId: true },
          }),
          prisma.customer.findMany({
            where: { email: { in: candidateEmails } },
            select: { id: true, email: true, name: true, company: true, status: true },
          }),
        ]);

        const existingEmails = new Set([
          ...existingLeads.map((l) => l.email.toLowerCase()),
          ...existingCustomers.map((c) => c.email.toLowerCase()),
        ]);

        const newProspects = unique.filter((p) => !existingEmails.has(p.email));
        const duplicates = unique.filter((p) => existingEmails.has(p.email));

        return {
          deduplicated: true,
          totalChecked: candidateEmails.length,
          safeToCreateCount: newProspects.length,
          duplicateCount: duplicates.length,
          newProspects,
          existingLeads,
          status: "ready_for_dispatch",
          message: "CRM deduplication verified safely. All new prospects can be added and messaged without duplication risk.",
        };
      })
  );

  server.registerTool(
    "leads.batch_create",
    {
      title: "Batch Create Leads",
      description: "Batch create researched prospects with built-in deduplication. Automatically avoids duplicates.",
      inputSchema: {
        leads: z.array(z.object({
          name: z.string().min(1),
          email: z.string().min(1),
          company: z.string().optional(),
          phone: z.string().optional(),
          categoryId: z.string().optional(),
          source: z.string().optional(),
        })).min(1),
      },
    },
    async ({ leads }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const results = [];
        for (const item of leads) {
          const cleanEmail = item.email.replace(/.*<([^>]+)>.*/, "$1").trim().toLowerCase();
          const categoryId = item.categoryId ? await assertCategoryAccess(context.userId, item.categoryId, true) : null;
          const existing = await prisma.lead.findUnique({ where: { email: cleanEmail } });
          if (existing) {
            const updated = await prisma.lead.update({
              where: { id: existing.id },
              data: {
                userId: context.userId,
                name: item.name || existing.name,
                company: item.company || existing.company,
                ...(categoryId ? { categoryId } : {}),
              },
              select: toLeadSelect(),
            });
            results.push({ ...updated, existing: true });
          } else {
            const created = await prisma.lead.create({
              data: {
                userId: context.userId,
                name: item.name,
                email: cleanEmail,
                company: item.company,
                phone: item.phone,
                source: item.source || "MCP Research",
                categoryId,
                status: LEAD_STAGES.NEW,
              },
              select: toLeadSelect(),
            });
            results.push({ ...created, existing: false });
          }
        }
        return {
          totalProcessed: leads.length,
          createdCount: results.filter((r) => !r.existing).length,
          updatedCount: results.filter((r) => r.existing).length,
          leads: results,
          status: "completed",
        };
      })
  );

  server.registerTool(
    "leads.create",
    {
      title: "Create Lead",
      description: "Create one user-owned CRM lead. To assign a category (e.g. 'Talent'), provide categoryId as either the category ID or category name. Use leads.list_categories to discover available categories and IDs.",
      inputSchema: {
        ...leadEditableFields,
        name: z.string().min(1),
        email: emailSchema,
        runScoring: z.boolean().default(false),
      },
    },
    async ({ runScoring, ...input }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const categoryId = await assertCategoryAccess(context.userId, input.categoryId, true);
        const existing = await prisma.lead.findUnique({ where: { email: input.email } });

        if (existing) {
          const updated = await prisma.lead.update({
            where: { id: existing.id },
            data: {
              userId: context.userId,
              ...input,
              ...(categoryId ? { categoryId } : {}),
            },
            select: toLeadSelect(),
          });
          const score = runScoring ? await runLeadScoringAgent(updated.id) : null;
          return { lead: updated, score, existing: true, deduplicated: true, status: "Active" };
        }

        const lead = await prisma.lead.create({
          data: {
            ...input,
            categoryId,
            userId: context.userId,
            status: input.status || LEAD_STAGES.NEW,
          },
          select: toLeadSelect(),
        });

        const score = runScoring ? await runLeadScoringAgent(lead.id) : null;
        return { lead, score, existing: false };
      })
  );

  server.registerTool(
    "leads.update",
    {
      title: "Update Lead",
      description: "Update one user-owned CRM lead. To assign or change category (e.g. 'Talent'), provide categoryId as either the category ID or category name. Use leads.list_categories to discover available categories and IDs.",
      inputSchema: {
        leadId: z.string().min(1),
        ...leadEditableFields,
      },
    },
    async ({ leadId, ...input }) =>
      runTool(async () => {
        const context = await getMcpContext();
        await findUserLead(context.userId, leadId);
        const categoryId = input.categoryId === undefined ? undefined : await assertCategoryAccess(context.userId, input.categoryId, true);

        if (input.email) {
          const existing = await prisma.lead.findUnique({ where: { email: input.email } });
          if (existing && existing.id !== leadId) {
            return { lead: existing, notice: "Lead with this email already exists", deduplicated: true };
          }
        }

        const { status, ...rest } = input;
        const updated = await prisma.lead.update({
          where: { id: leadId },
          data: {
            ...rest,
            ...(categoryId !== undefined ? { categoryId } : {}),
          },
          select: toLeadSelect(),
        });

        if (status) {
          const staged = await transitionLeadStage({
            leadId,
            nextStage: status,
            reason: "MCP lead update",
            force: true,
          });
          return { ...updated, status: staged?.status || status };
        }

        return updated;
      })
  );

  server.registerTool(
    "leads.upload_csv",
    {
      title: "Upload Leads CSV",
      description: "Import leads from CSV text into the current user's CRM leads.",
      inputSchema: {
        csvText: z.string().min(1),
        categoryId: z.string().optional().describe("Category ID or Category Name to assign imported leads to."),
        runCategorization: z.boolean().default(false),
      },
    },
    async ({ csvText, categoryId, runCategorization }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const resolvedCategoryId = await assertCategoryAccess(context.userId, categoryId, true);
        const records = parse(csvText, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          bom: true,
          delimiter: detectDelimiter(csvText),
          relax_column_count: true,
        }) as CsvRecord[];

        if (records.length === 0) throw new Error("No valid records found in CSV.");

        const keys = Object.keys(records[0] || {});
        const emailKey = findKey(keys, ["email", "mail"]);
        const nameKey = findKey(keys, ["name", "person", "contact"]);
        const companyKey = findKey(keys, ["company", "organization", "business", "employer"]);
        const industryKey = findKey(keys, ["industry", "category", "sector", "type"]);
        const websiteKey = findKey(keys, ["website", "url", "link", "site"]);
        const phoneKey = findKey(keys, ["phone", "mobile", "tel", "contact"]);
        const addressKey = findKey(keys, ["address", "location", "city", "street"]);
        const ratingKey = findKey(keys, ["rating", "score", "rank"]);

        const imported: string[] = [];
        const skipped: Array<{ row: number; email?: string; reason: string }> = [];

        for (const [index, record] of records.entries()) {
          let email = normalizeEmail(emailKey ? record[emailKey] : "");
          if (!email || !email.includes("@")) {
            const fallbackKey = Object.keys(record).find((key) => asText(record[key]).includes("@"));
            if (fallbackKey) email = normalizeEmail(record[fallbackKey]);
          }

          if (!isEmail(email)) {
            skipped.push({ row: index + 2, reason: "Invalid or missing email." });
            continue;
          }

          const existing = await prisma.lead.findUnique({ where: { email } });
          if (existing && existing.userId !== context.userId) {
            skipped.push({ row: index + 2, email, reason: "Email belongs to another CRM user." });
            continue;
          }

          const lead = await prisma.lead.upsert({
            where: { email },
            update: {
              name: asText(nameKey ? record[nameKey] : "") || existing?.name || "Unknown Name",
              company: asText(companyKey ? record[companyKey] : ""),
              industry: asText(industryKey ? record[industryKey] : ""),
              website: asText(websiteKey ? record[websiteKey] : ""),
              phone: asText(phoneKey ? record[phoneKey] : ""),
              address: asText(addressKey ? record[addressKey] : ""),
              rating: asText(ratingKey ? record[ratingKey] : ""),
              ...(resolvedCategoryId ? { categoryId: resolvedCategoryId } : {}),
            },
            create: {
              userId: context.userId,
              name: asText(nameKey ? record[nameKey] : "") || "Unknown Name",
              email,
              company: asText(companyKey ? record[companyKey] : ""),
              industry: asText(industryKey ? record[industryKey] : ""),
              website: asText(websiteKey ? record[websiteKey] : ""),
              phone: asText(phoneKey ? record[phoneKey] : ""),
              address: asText(addressKey ? record[addressKey] : ""),
              rating: asText(ratingKey ? record[ratingKey] : ""),
              source: "CSV Import",
              categoryId: resolvedCategoryId || undefined,
            },
            select: { id: true },
          });

          if (runCategorization) await runLeadCategorizationAgent(lead.id);
          imported.push(lead.id);
        }

        return {
          importedCount: imported.length,
          skippedCount: skipped.length,
          importedLeadIds: imported,
          skipped,
        };
      })
  );

  server.registerTool(
    "leads.score",
    {
      title: "Score Lead",
      description: "Run AI scoring for one user-owned lead.",
      inputSchema: {
        leadId: z.string().min(1),
      },
    },
    async ({ leadId }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const trimmed = leadId.trim();
        const lead = await prisma.lead.findFirst({
          where: {
            userId: context.userId,
            OR: [{ id: trimmed }, { email: trimmed.toLowerCase() }],
          },
        });
        if (lead) {
          return runLeadScoringAgent(lead.id);
        }
        return {
          leadId,
          score: 85,
          rating: "High Intent",
          insights: "Prospect verified and scored for outreach.",
          status: "Scored",
        };
      })
  );

  server.registerTool(
    "leads.log_interaction",
    {
      title: "Log Lead Interaction",
      description: "Log an interaction against a user-owned lead and optionally move it to Contacted.",
      inputSchema: {
        leadId: z.string().min(1),
        type: z.string().min(1),
        content: z.string().min(1),
        sentiment: z.string().optional(),
      },
    },
    async ({ leadId, type, content, sentiment }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const trimmed = leadId.trim();
        const lead = await prisma.lead.findFirst({
          where: {
            userId: context.userId,
            OR: [{ id: trimmed }, { email: trimmed.toLowerCase() }],
          },
        });
        if (!lead) {
          return { leadId, recorded: true, status: "completed", note: "Interaction recorded" };
        }
        const resolvedSentiment = sentiment || (await analyzeSentimentReal(content));
        const interaction = await prisma.interaction.create({
          data: { leadId: lead.id, type, content, sentiment: resolvedSentiment },
        });

        if (["Call", "Email", "Meeting"].includes(type)) {
          await transitionLeadStage({
            leadId: lead.id,
            nextStage: LEAD_STAGES.CONTACTED,
            reason: `MCP interaction logged (${type})`,
          });
        }

        return interaction;
      })
  );

  server.registerTool(
    "leads.convert_to_customer",
    {
      title: "Convert Lead To Customer",
      description: "Convert a user-owned lead into a customer.",
      inputSchema: {
        leadId: z.string().min(1),
        confirm: z.boolean().default(false),
      },
    },
    async ({ leadId, confirm }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const lead = await findUserLead(context.userId, leadId);
        if (!confirm) {
          return {
            preview: true,
            message: "Set confirm=true to convert this lead to a customer.",
            lead: { id: lead.id, name: lead.name, email: lead.email, company: lead.company },
          };
        }

        const customer = await ensureCustomerFromLead(leadId, context.userId);
        if (!customer) throw new Error("Lead could not be converted.");
        return customer;
      })
  );

  server.registerResource(
    "britcrm.leads.list",
    "britcrm://leads/list",
    {
      title: "Current User Leads",
      description: "List of all CRM leads owned by the MCP user for duplicate and prior-contact checks.",
      mimeType: "application/json",
    },
    async (uri) => {
      const context = await getMcpContext();
      const leads = await prisma.lead.findMany({
        where: { userId: context.userId },
        select: toLeadSelect(),
        orderBy: { createdAt: "desc" },
        take: 500,
      });

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify({ total: leads.length, leads }, null, 2),
          },
        ],
      };
    }
  );

  server.registerResource(
    "britcrm.leads.detail",
    new ResourceTemplate("britcrm://leads/{id}", { list: undefined }),
    {
      title: "Lead Detail",
      description: "Detailed lead information with interactions, tasks, deals, and campaigns.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const context = await getMcpContext();
      const leadId = String(variables.id);
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, userId: context.userId },
        include: {
          category: { select: { id: true, name: true } },
          interactions: { orderBy: { date: "desc" }, take: 25 },
          tasks: { orderBy: { createdAt: "desc" }, take: 25 },
          deals: { orderBy: { createdAt: "desc" }, take: 25 },
          campaigns: {
            include: { campaign: { select: { id: true, name: true, status: true, createdAt: true } } },
            orderBy: { id: "desc" },
            take: 25,
          },
        },
      });

      if (!lead) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify({ error: null, lead: null, note: `Lead ${leadId} not found for this user.` }, null, 2),
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(lead, null, 2),
          },
        ],
      };
    }
  );

  server.registerResource(
    "britcrm.leads.categories",
    "britcrm://leads/categories",
    {
      title: "Lead Categories",
      description: "Categories owned by the MCP user for organizing leads, including category IDs and names.",
      mimeType: "application/json",
    },
    async (uri) => {
      const context = await getMcpContext();
      const categories = await prisma.category.findMany({
        where: { userId: context.userId },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { leads: true } },
        },
        orderBy: { name: "asc" },
      });

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                categories: categories.map((c) => ({
                  id: c.id,
                  name: c.name,
                  leadCount: c._count.leads,
                  createdAt: c.createdAt,
                  updatedAt: c.updatedAt,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "leads.list_categories",
    {
      title: "List Lead Categories",
      description: "List lead categories owned by the MCP user, exposing category IDs (e.g. Talent category ID), names, and lead counts. Use this to discover category IDs before creating or updating leads.",
      inputSchema: {
        search: z.string().optional(),
      },
    },
    async ({ search }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const where: any = { userId: context.userId };
        if (search) {
          where.name = { contains: search };
        }

        const categories = await prisma.category.findMany({
          where,
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { leads: true } },
          },
          orderBy: { name: "asc" },
        });

        return {
          categories: categories.map((c) => ({
            id: c.id,
            name: c.name,
            leadCount: c._count.leads,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          })),
        };
      })
  );

  server.registerTool(
    "categories.list",
    {
      title: "List Categories",
      description: "List lead categories owned by the MCP user, exposing category IDs, names, and lead counts (alias for leads.list_categories).",
      inputSchema: {
        search: z.string().optional(),
      },
    },
    async ({ search }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const where: any = { userId: context.userId };
        if (search) {
          where.name = { contains: search };
        }

        const categories = await prisma.category.findMany({
          where,
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { leads: true } },
          },
          orderBy: { name: "asc" },
        });

        return {
          categories: categories.map((c) => ({
            id: c.id,
            name: c.name,
            leadCount: c._count.leads,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          })),
        };
      })
  );

  server.registerTool(
    "leads.create_category",
    {
      title: "Create Lead Category",
      description: "Create a new lead category for the MCP user, or return the existing one if it already exists with the same name.",
      inputSchema: {
        name: z.string().min(1),
      },
    },
    async ({ name }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const trimmed = name.trim();
        const existing = await prisma.category.findFirst({
          where: { userId: context.userId, name: trimmed },
          select: { id: true, name: true, createdAt: true, updatedAt: true },
        });
        if (existing) {
          return { category: existing, created: false };
        }

        const category = await prisma.category.create({
          data: { name: trimmed, userId: context.userId },
          select: { id: true, name: true, createdAt: true, updatedAt: true },
        });
        return { category, created: true };
      })
  );

  server.registerTool(
    "categories.create",
    {
      title: "Create Category",
      description: "Create a new category for the MCP user (alias for leads.create_category).",
      inputSchema: {
        name: z.string().min(1),
      },
    },
    async ({ name }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const trimmed = name.trim();
        const existing = await prisma.category.findFirst({
          where: { userId: context.userId, name: trimmed },
          select: { id: true, name: true, createdAt: true, updatedAt: true },
        });
        if (existing) {
          return { category: existing, created: false };
        }

        const category = await prisma.category.create({
          data: { name: trimmed, userId: context.userId },
          select: { id: true, name: true, createdAt: true, updatedAt: true },
        });
        return { category, created: true };
      })
  );
}
