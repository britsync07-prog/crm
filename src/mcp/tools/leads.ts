import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/db";
import { analyzeSentimentReal, runLeadCategorizationAgent, runLeadScoringAgent } from "@/lib/ai-agents";
import { ensureCustomerFromLead, LEAD_STAGES, transitionLeadStage } from "@/lib/crm-lifecycle";
import { getMcpContext } from "../context";

const emailSchema = z.string().email().transform((value) => value.trim().toLowerCase());
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
  categoryId: z.string().nullable().optional(),
};

type CsvRecord = Record<string, unknown>;

function jsonResult(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

async function runTool<T>(operation: () => Promise<T>) {
  try {
    const data = await operation();
    return jsonResult({ success: true, data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResult({ success: false, data: null, error: message });
  }
}

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

async function assertCategoryAccess(userId: string, categoryId?: string | null) {
  if (!categoryId) return null;
  const trimmed = categoryId.trim();
  const category = await prisma.category.findFirst({
    where: {
      userId,
      OR: [{ id: trimmed }, { name: trimmed }],
    },
    select: { id: true },
  });
  if (!category) throw new Error("Category not found for this MCP user.");
  return category.id;
}

async function findUserLead(userId: string, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId },
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
      description: "List CRM leads owned by the MCP user with filters.",
      inputSchema: {
        search: z.string().optional(),
        status: z.string().optional(),
        categoryId: z.string().optional(),
        source: z.string().optional(),
        company: z.string().optional(),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      },
    },
    async ({ search, status, categoryId, source, company, limit, offset }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const where: any = { userId: context.userId };
        if (status) where.status = status;
        if (categoryId) {
          const resolved = await assertCategoryAccess(context.userId, categoryId).catch(() => categoryId);
          where.categoryId = resolved;
        }
        if (source) where.source = { contains: source };
        if (company) where.company = { contains: company };
        if (search) {
          where.OR = [
            { name: { contains: search } },
            { email: { contains: search } },
            { company: { contains: search } },
            { industry: { contains: search } },
          ];
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
    "leads.create",
    {
      title: "Create Lead",
      description: "Create one user-owned CRM lead.",
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
        const categoryId = await assertCategoryAccess(context.userId, input.categoryId);
        const existing = await prisma.lead.findUnique({ where: { email: input.email } });

        if (existing && existing.userId !== context.userId) {
          throw new Error("A lead with this email already belongs to another CRM user.");
        }
        if (existing) {
          throw new Error("A lead with this email already exists for this MCP user. Use leads.update.");
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
        return { lead, score };
      })
  );

  server.registerTool(
    "leads.update",
    {
      title: "Update Lead",
      description: "Update one user-owned CRM lead.",
      inputSchema: {
        leadId: z.string().min(1),
        ...leadEditableFields,
      },
    },
    async ({ leadId, ...input }) =>
      runTool(async () => {
        const context = await getMcpContext();
        await findUserLead(context.userId, leadId);
        const categoryId = input.categoryId === undefined ? undefined : await assertCategoryAccess(context.userId, input.categoryId);

        if (input.email) {
          const existing = await prisma.lead.findUnique({ where: { email: input.email } });
          if (existing && existing.id !== leadId) {
            throw new Error("Another lead already uses this email.");
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
        categoryId: z.string().optional(),
        runCategorization: z.boolean().default(false),
      },
    },
    async ({ csvText, categoryId, runCategorization }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const resolvedCategoryId = await assertCategoryAccess(context.userId, categoryId);
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
        await findUserLead(context.userId, leadId);
        return runLeadScoringAgent(leadId);
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
        await findUserLead(context.userId, leadId);
        const resolvedSentiment = sentiment || (await analyzeSentimentReal(content));
        const interaction = await prisma.interaction.create({
          data: { leadId, type, content, sentiment: resolvedSentiment },
        });

        if (["Call", "Email", "Meeting"].includes(type)) {
          await transitionLeadStage({
            leadId,
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
