import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  ensureReferralTables,
  getAdminReferralOverview,
  getAllReferralLinks,
  getReferralLinkDetails,
  getReferralLinkByCode,
  createReferralLink,
  updateReferralLink,
  deleteReferralLink,
  sanitizeReferralCode,
} from "@/lib/referral";
import { getAppBaseUrl } from "@/lib/app-url";
import { getMcpContext } from "../context";
import { runTool } from "../utils";

async function requireMcpAdmin() {
  const context = await getMcpContext();
  if (context.role !== "ADMIN") {
    throw new Error("Referral MCP tools require an ADMIN user context.");
  }
  return context;
}

export function registerReferralTools(server: McpServer) {
  // 1. Get high-level overview & KPI statistics
  server.registerTool(
    "admin.referrals.get_overview",
    {
      title: "Get Referral Marketing Overview",
      description:
        "Admin-only overview of the referral program: total marketing agencies, link clicks/visits, unique visitors, signups, purchases, and total attributed revenue.",
      inputSchema: {},
    },
    async () =>
      runTool(async () => {
        await requireMcpAdmin();
        await ensureReferralTables();
        const overview = await getAdminReferralOverview();
        return {
          overview,
          confirmed: true,
        };
      })
  );

  // 2. List all referral links with metrics & conversion rates
  server.registerTool(
    "admin.referrals.list_links",
    {
      title: "List Referral Links",
      description:
        "List all agency referral links with performance metrics: visits, signups, purchases, revenue, conversion rates, and active/paused status.",
      inputSchema: {
        status: z
          .enum(["all", "active", "paused"])
          .default("all")
          .describe("Filter by campaign status (all, active, or paused)"),
        search: z
          .string()
          .optional()
          .describe("Search by agency name or referral code"),
        sortBy: z
          .enum(["visits", "signups", "purchases", "revenue", "newest", "agency"])
          .default("visits")
          .describe("Sort order for results"),
      },
    },
    async ({ status, search, sortBy }) =>
      runTool(async () => {
        await requireMcpAdmin();
        await ensureReferralTables();
        const baseUrl = getAppBaseUrl();
        const links = await getAllReferralLinks({
          status,
          search,
          sortBy,
        });

        const linksWithFullUrls = links.map((l) => ({
          ...l,
          fullUrl: `${baseUrl}/r/${l.code}`,
        }));

        return {
          count: linksWithFullUrls.length,
          links: linksWithFullUrls,
          confirmed: true,
        };
      })
  );

  // 3. Create a new referral link for an agency or campaign
  server.registerTool(
    "admin.referrals.create_link",
    {
      title: "Create Referral Link",
      description:
        "Create a new referral link for a marketing agency or promotional campaign. Generates a unique tracking URL, sets target landing page, and tracks visits, signups, and purchases.",
      inputSchema: {
        agencyName: z
          .string()
          .trim()
          .min(1)
          .describe("Name of the marketing agency or partner (e.g. 'Apex Growth Media')"),
        code: z
          .string()
          .trim()
          .min(1)
          .describe("Unique referral slug / code (e.g. 'apex-growth', 'youtube-promo')"),
        targetUrl: z
          .string()
          .default("/")
          .describe("Destination landing URL (default '/' or '/pricing', '/signup')"),
        notes: z
          .string()
          .optional()
          .describe("Optional campaign notes, partner contacts, or commission terms"),
        confirm: z
          .boolean()
          .default(true)
          .describe("Auto-confirmed for pre-authorized execution"),
      },
    },
    async (args) =>
      runTool(async () => {
        const context = await requireMcpAdmin();
        await ensureReferralTables();
        const baseUrl = getAppBaseUrl();
        const code = sanitizeReferralCode(args.code);

        const payload = {
          agencyName: args.agencyName.trim(),
          code,
          targetUrl: args.targetUrl.trim() || "/",
          notes: args.notes?.trim() || null,
        };

        if (!args.confirm) {
          return {
            previewOnly: true,
            action: "create_referral_link",
            payload,
            previewUrl: `${baseUrl}/r/${code}`,
          };
        }

        const result = await createReferralLink({
          agencyName: payload.agencyName,
          code: payload.code,
          targetUrl: payload.targetUrl,
          notes: payload.notes || undefined,
          createdBy: context.userId,
        });

        if (!result.success || !result.link) {
          throw new Error(result.error || "Failed to create referral link.");
        }

        await prisma.activityLog.create({
          data: {
            userId: context.userId,
            action: "MCP_ADMIN_CREATE_REFERRAL_LINK",
            details: `Created referral link ${code} for agency ${payload.agencyName}`,
          },
        });

        return {
          confirmed: true,
          link: result.link,
          fullUrl: `${baseUrl}/r/${result.link.code}`,
          message: `Referral link created successfully for "${result.link.agencyName}".`,
        };
      })
  );

  // 4. Get deep-dive details: clients who signed up and traffic logs
  server.registerTool(
    "admin.referrals.get_link_details",
    {
      title: "Get Referral Link Details & Clients",
      description:
        "Inspect a specific referral link to see performance stats, list of clients who signed up (name, email, registration date, subscription plan, revenue contributed), and recent click traffic logs.",
      inputSchema: {
        id: z.string().optional().describe("Referral link ID"),
        code: z.string().optional().describe("Referral link code / slug (if ID is unknown)"),
      },
    },
    async ({ id, code }) =>
      runTool(async () => {
        await requireMcpAdmin();
        await ensureReferralTables();
        const baseUrl = getAppBaseUrl();

        let linkId = id;
        if (!linkId && code) {
          const found = await getReferralLinkByCode(code);
          if (found) linkId = found.id;
        }

        if (!linkId) {
          throw new Error("Either 'id' or 'code' is required to fetch link details.");
        }

        const details = await getReferralLinkDetails(linkId);
        if (!details.link) {
          throw new Error(`Referral link not found for identifier: ${id || code}`);
        }

        return {
          confirmed: true,
          link: {
            ...details.link,
            fullUrl: `${baseUrl}/r/${details.link.code}`,
          },
          clientsCount: details.clients.length,
          clients: details.clients,
          recentVisitsCount: details.recentVisits.length,
          recentVisits: details.recentVisits,
        };
      })
  );

  // 5. Update an existing referral link
  server.registerTool(
    "admin.referrals.update_link",
    {
      title: "Update Referral Link",
      description:
        "Update an agency referral link: modify agency name, code, destination URL, campaign notes, or active status.",
      inputSchema: {
        id: z.string().min(1).describe("Referral link ID to update"),
        agencyName: z.string().trim().optional().describe("New agency name"),
        code: z.string().trim().optional().describe("New referral code / slug"),
        targetUrl: z.string().trim().optional().describe("New destination URL"),
        notes: z.string().optional().describe("Updated campaign notes"),
        isActive: z.boolean().optional().describe("Active (true) or paused (false)"),
        confirm: z
          .boolean()
          .default(true)
          .describe("Auto-confirmed for pre-authorized execution"),
      },
    },
    async (args) =>
      runTool(async () => {
        const context = await requireMcpAdmin();
        await ensureReferralTables();
        const baseUrl = getAppBaseUrl();

        if (!args.confirm) {
          return {
            previewOnly: true,
            action: "update_referral_link",
            id: args.id,
            updates: args,
          };
        }

        const result = await updateReferralLink(args.id, {
          agencyName: args.agencyName,
          code: args.code,
          targetUrl: args.targetUrl,
          notes: args.notes,
          isActive: args.isActive,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to update referral link.");
        }

        await prisma.activityLog.create({
          data: {
            userId: context.userId,
            action: "MCP_ADMIN_UPDATE_REFERRAL_LINK",
            details: `Updated referral link ${args.id}`,
          },
        });

        const updatedDetails = await getReferralLinkDetails(args.id);

        return {
          confirmed: true,
          updated: true,
          link: updatedDetails.link
            ? {
                ...updatedDetails.link,
                fullUrl: `${baseUrl}/r/${updatedDetails.link.code}`,
              }
            : null,
          message: "Referral link updated successfully.",
        };
      })
  );

  // 6. Toggle active / paused status
  server.registerTool(
    "admin.referrals.toggle_status",
    {
      title: "Toggle Referral Link Active Status",
      description: "Quickly pause or activate an agency referral link.",
      inputSchema: {
        id: z.string().min(1).describe("Referral link ID"),
        isActive: z
          .boolean()
          .optional()
          .describe("Target status: true for active, false for paused. If omitted, flips current status."),
        confirm: z
          .boolean()
          .default(true)
          .describe("Auto-confirmed for pre-authorized execution"),
      },
    },
    async ({ id, isActive, confirm }) =>
      runTool(async () => {
        const context = await requireMcpAdmin();
        await ensureReferralTables();

        const current = await getReferralLinkDetails(id);
        if (!current.link) {
          throw new Error(`Referral link not found with ID: ${id}`);
        }

        const targetStatus = isActive !== undefined ? isActive : !current.link.isActive;

        if (!confirm) {
          return {
            previewOnly: true,
            action: "toggle_referral_status",
            id,
            targetStatus,
          };
        }

        const result = await updateReferralLink(id, { isActive: targetStatus });
        if (!result.success) {
          throw new Error(result.error || "Failed to toggle referral status.");
        }

        await prisma.activityLog.create({
          data: {
            userId: context.userId,
            action: "MCP_ADMIN_TOGGLE_REFERRAL_LINK",
            details: `Set referral link ${id} active status to ${targetStatus}`,
          },
        });

        return {
          confirmed: true,
          id,
          isActive: targetStatus,
          message: `Referral link is now ${targetStatus ? "Active" : "Paused"}.`,
        };
      })
  );

  // 7. Delete a referral link
  server.registerTool(
    "admin.referrals.delete_link",
    {
      title: "Delete Referral Link",
      description: "Delete an agency referral link and its associated visit and conversion records.",
      inputSchema: {
        id: z.string().min(1).describe("Referral link ID to delete"),
        confirm: z
          .boolean()
          .default(true)
          .describe("Auto-confirmed for pre-authorized execution"),
      },
    },
    async ({ id, confirm }) =>
      runTool(async () => {
        const context = await requireMcpAdmin();
        await ensureReferralTables();

        if (!confirm) {
          return {
            previewOnly: true,
            action: "delete_referral_link",
            id,
          };
        }

        const result = await deleteReferralLink(id);
        if (!result.success) {
          throw new Error(result.error || "Failed to delete referral link.");
        }

        await prisma.activityLog.create({
          data: {
            userId: context.userId,
            action: "MCP_ADMIN_DELETE_REFERRAL_LINK",
            details: `Deleted referral link ${id}`,
          },
        });

        return {
          confirmed: true,
          deleted: true,
          id,
          message: "Referral link deleted successfully.",
        };
      })
  );
}
