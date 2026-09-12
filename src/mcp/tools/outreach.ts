import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { launchOutreachCampaign, parseRecipients } from "@/lib/outreach-worker";
import { runOutreachReplySync } from "@/lib/outreach-reply-worker";
import { getMcpContext } from "../context";

const leadFiltersSchema = z
  .object({
    enabled: z.boolean().default(false),
    categoryIds: z.array(z.string()).default([]),
    includeStatuses: z.array(z.string()).default([]),
    excludeStatuses: z.array(z.string()).default([]),
  })
  .default({ enabled: false, categoryIds: [], includeStatuses: [], excludeStatuses: [] });

const campaignInputSchema = {
  campaignName: z.string().min(1),
  senderName: z.string().default("BritCRM Outreach"),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  recipients: z.string().default(""),
  includeManualRecipients: z.boolean().default(true),
  leadFilters: leadFiltersSchema,
  smtpAccountIds: z.array(z.string()).min(1),
};

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

function collectInvalidRecipients(raw: string) {
  return raw
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

async function verifySenderAccounts(userId: string, smtpAccountIds: string[]) {
  const accounts = await prisma.emailAccount.findMany({
    where: {
      id: { in: smtpAccountIds },
      userId,
      isActive: true,
    },
    select: { id: true, email: true, sentToday: true },
  });

  const found = new Set(accounts.map((account) => account.id));
  const missing = smtpAccountIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new Error(`Some sender accounts are not active or not owned by this MCP user: ${missing.join(", ")}`);
  }

  return accounts;
}

async function resolveLeadRecipients(userId: string, filters: z.infer<typeof leadFiltersSchema>) {
  if (!filters.enabled) return [];

  const where: Prisma.LeadWhereInput = { userId };
  if (filters.categoryIds.length > 0) where.categoryId = { in: filters.categoryIds };
  if (filters.includeStatuses.length > 0) where.status = { in: filters.includeStatuses };
  if (filters.excludeStatuses.length > 0) {
    where.status = {
      ...(where.status as Prisma.StringFilter | undefined),
      notIn: filters.excludeStatuses,
    };
  }

  const leads = await prisma.lead.findMany({
    where,
    select: { id: true, name: true, email: true, status: true, categoryId: true },
    orderBy: { createdAt: "desc" },
  });

  return leads;
}

async function buildCampaignPreview(input: {
  userId: string;
  recipients: string;
  includeManualRecipients: boolean;
  leadFilters: z.infer<typeof leadFiltersSchema>;
  smtpAccountIds: string[];
}) {
  const accounts = await verifySenderAccounts(input.userId, input.smtpAccountIds);
  const manualRecipients = input.includeManualRecipients ? parseRecipients(input.recipients) : [];
  const invalidManualRecipients = input.includeManualRecipients ? collectInvalidRecipients(input.recipients) : [];
  const leadMatches = await resolveLeadRecipients(input.userId, input.leadFilters);
  const leadRecipients = parseRecipients(leadMatches.map((lead) => lead.email).join("\n"));
  const recipients = Array.from(new Set([...manualRecipients, ...leadRecipients]));

  return {
    totalRecipients: recipients.length,
    recipients,
    invalidManualRecipients,
    duplicateCount: manualRecipients.length + leadRecipients.length - recipients.length,
    sourceBreakdown: {
      manual: manualRecipients.length,
      leads: leadRecipients.length,
    },
    leadMatches: leadMatches.length,
    senderAccounts: accounts,
  };
}

async function getCampaignAnalytics(campaignId: string, userId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: {
      leads: {
        include: {
          lead: {
            select: { id: true, name: true, email: true, company: true, status: true },
          },
        },
        orderBy: { id: "asc" },
      },
      emailAccount: { select: { id: true, email: true } },
    },
  });

  if (!campaign) throw new Error("Campaign not found for this MCP user.");

  const sent = campaign.leads.filter((lead) => lead.sentAt).length;
  const delivered = campaign.leads.filter((lead) => lead.status === "Sent").length;
  const bounced = campaign.leads.filter((lead) => lead.status === "Bounced").length;
  const opens = campaign.leads.filter((lead) => lead.openedAt).length;
  const replies = campaign.leads.filter((lead) => lead.repliedAt).length;

  return {
    campaign,
    counts: { sent, delivered, bounced, opens, replies, total: campaign.leads.length },
    metrics: {
      deliveryRate: percent(delivered, sent),
      bounceRate: percent(bounced, sent),
      openRate: percent(opens, delivered),
      replyRate: percent(replies, delivered),
    },
  };
}

export function registerOutreachTools(server: McpServer) {
  server.registerTool(
    "outreach.preview_campaign",
    {
      title: "Preview Outreach Campaign",
      description: "Preview recipients, sender accounts, duplicates, and invalid emails before launching.",
      inputSchema: campaignInputSchema,
    },
    async (input) =>
      runTool(async () => {
        const context = await getMcpContext();
        const preview = await buildCampaignPreview({ userId: context.userId, ...input });
        return {
          ...preview,
          readyToLaunch: preview.totalRecipients > 0,
          sampleRecipients: preview.recipients.slice(0, 10),
        };
      })
  );

  server.registerTool(
    "outreach.launch_campaign",
    {
      title: "Launch Outreach Campaign",
      description: "Launch an email outreach campaign after explicit confirmation.",
      inputSchema: {
        ...campaignInputSchema,
        confirm: z.boolean().default(false),
      },
    },
    async ({ confirm, ...input }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const preview = await buildCampaignPreview({ userId: context.userId, ...input });
        if (preview.totalRecipients === 0) throw new Error("At least one valid recipient is required.");
        if (!confirm) {
          return {
            preview: true,
            message: "Set confirm=true to launch this campaign.",
            ...preview,
            recipients: preview.recipients.slice(0, 25),
          };
        }

        const campaign = await launchOutreachCampaign({
          userId: context.userId,
          campaignName: input.campaignName,
          senderName: input.senderName,
          subject: input.subject,
          htmlContent: input.htmlContent,
          recipients: preview.recipients,
          smtpAccountIds: input.smtpAccountIds,
        });

        return {
          campaignId: campaign.id,
          status: campaign.status,
          totalRecipients: preview.totalRecipients,
          sourceBreakdown: preview.sourceBreakdown,
        };
      })
  );

  server.registerTool(
    "outreach.list_campaigns",
    {
      title: "List Outreach Campaigns",
      description: "List campaign history and metrics for the MCP user.",
      inputSchema: {
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      },
    },
    async ({ status, search, limit, offset }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const where: Prisma.CampaignWhereInput = { userId: context.userId };
        if (status) where.status = status;
        if (search) {
          where.OR = [{ name: { contains: search } }, { subject: { contains: search } }];
        }

        const campaigns = await prisma.campaign.findMany({
          where,
          include: {
            leads: { select: { status: true, sentAt: true, openedAt: true, repliedAt: true } },
            emailAccount: { select: { id: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        });

        return campaigns.map((campaign) => {
          const sent = campaign.leads.filter((lead) => lead.sentAt).length;
          const delivered = campaign.leads.filter((lead) => lead.status === "Sent").length;
          const bounced = campaign.leads.filter((lead) => lead.status === "Bounced").length;
          const opens = campaign.leads.filter((lead) => lead.openedAt).length;
          const replies = campaign.leads.filter((lead) => lead.repliedAt).length;

          return {
            id: campaign.id,
            name: campaign.name,
            subject: campaign.subject,
            status: campaign.status,
            sender: campaign.emailAccount,
            createdAt: campaign.createdAt,
            counts: { total: campaign.leads.length, sent, delivered, bounced, opens, replies },
            metrics: {
              deliveryRate: percent(delivered, sent),
              openRate: percent(opens, delivered),
              replyRate: percent(replies, delivered),
            },
          };
        });
      })
  );

  server.registerTool(
    "outreach.get_campaign",
    {
      title: "Get Outreach Campaign",
      description: "Get one campaign with lead-level delivery status and metrics.",
      inputSchema: { campaignId: z.string().min(1) },
    },
    async ({ campaignId }) =>
      runTool(async () => {
        const context = await getMcpContext();
        return getCampaignAnalytics(campaignId, context.userId);
      })
  );

  server.registerTool(
    "outreach.send_follow_up",
    {
      title: "Send Outreach Follow Up",
      description: "Create and launch a follow-up campaign for eligible recipients from an existing campaign.",
      inputSchema: {
        campaignId: z.string().min(1),
        targetFilter: z.enum(["no_reply", "opened_no_reply", "sent_all", "custom_status"]).default("no_reply"),
        customStatus: z.string().optional(),
        senderName: z.string().default("BritCRM Outreach"),
        subject: z.string().min(1),
        htmlContent: z.string().min(1),
        smtpAccountIds: z.array(z.string()).min(1),
        confirm: z.boolean().default(false),
      },
    },
    async ({ campaignId, targetFilter, customStatus, senderName, subject, htmlContent, smtpAccountIds, confirm }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const original = await prisma.campaign.findFirst({
          where: { id: campaignId, userId: context.userId },
          select: { id: true, name: true },
        });
        if (!original) throw new Error("Campaign not found for this MCP user.");
        await verifySenderAccounts(context.userId, smtpAccountIds);

        const where: Prisma.CampaignLeadWhereInput = {
          campaignId,
          status: { not: "Bounced" },
          sentAt: { not: null },
        };
        if (targetFilter === "no_reply") where.repliedAt = null;
        if (targetFilter === "opened_no_reply") {
          where.openedAt = { not: null };
          where.repliedAt = null;
        }
        if (targetFilter === "custom_status") {
          if (!customStatus) throw new Error("customStatus is required when targetFilter is custom_status.");
          where.status = customStatus;
        }

        const targets = await prisma.campaignLead.findMany({
          where,
          include: { lead: { select: { email: true } } },
        });
        const recipients = Array.from(new Set(targets.map((target) => target.lead.email)));
        if (recipients.length === 0) throw new Error("No eligible follow-up recipients found.");

        if (!confirm) {
          return {
            preview: true,
            message: "Set confirm=true to send this follow-up campaign.",
            originalCampaignId: campaignId,
            targetFilter,
            totalRecipients: recipients.length,
            sampleRecipients: recipients.slice(0, 10),
          };
        }

        const campaign = await launchOutreachCampaign({
          userId: context.userId,
          campaignName: `Follow-up: ${original.name}`,
          senderName,
          subject,
          htmlContent,
          recipients,
          smtpAccountIds,
        });

        return { campaignId: campaign.id, status: campaign.status, totalRecipients: recipients.length };
      })
  );

  server.registerTool(
    "outreach.process_replies",
    {
      title: "Process Outreach Replies",
      description: "Scan this MCP user's connected inboxes for outreach replies and update campaign lead reply status.",
      inputSchema: {},
    },
    async () =>
      runTool(async () => {
        const context = await getMcpContext();
        return runOutreachReplySync({ userId: context.userId });
      })
  );
}
