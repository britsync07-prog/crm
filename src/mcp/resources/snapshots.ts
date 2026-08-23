import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prisma } from "@/lib/db";
import { getMcpContext } from "../context";

function jsonResource(uri: URL, payload: unknown) {
  return {
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function registerSnapshotResources(server: McpServer) {
  server.registerResource(
    "britcrm.snapshot.user",
    "britcrm://snapshot/user",
    {
      title: "Current User MCP Snapshot",
      description: "Account-bound CRM snapshot for the resolved MCP user, including dashboard counts and safe configuration status.",
      mimeType: "application/json",
    },
    async (uri) => {
      const context = await getMcpContext();

      const [
        user,
        emailAccounts,
        leads,
        customers,
        campaigns,
        activeCampaigns,
        forms,
        formSubmissions,
        calendarEvents,
        upcomingEvents,
        recentActivity,
      ] = await Promise.all([
        prisma.user.findUnique({
          where: { id: context.userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            ownedOrganization: {
              select: {
                id: true,
                name: true,
                plan: true,
                seatLimit: true,
                subscriptionStatus: true,
                subscriptionEndDate: true,
              },
            },
            memberProfile: {
              select: {
                role: true,
                status: true,
                organization: {
                  select: {
                    id: true,
                    name: true,
                    plan: true,
                    seatLimit: true,
                    subscriptionStatus: true,
                  },
                },
              },
            },
          },
        }),
        prisma.emailAccount.count({ where: { userId: context.userId, isActive: true } }),
        prisma.lead.count({ where: { userId: context.userId } }),
        prisma.customer.count({ where: { userId: context.userId } }),
        prisma.campaign.count({ where: { userId: context.userId } }),
        prisma.campaign.count({ where: { userId: context.userId, status: { in: ["Running", "ACTIVE", "Active"] } } }),
        prisma.form.count({ where: { ownerId: context.userId } }),
        prisma.formSubmission.count({ where: { form: { ownerId: context.userId } } }),
        prisma.calendarEvent.count({ where: { userId: context.userId } }),
        prisma.calendarEvent.findMany({
          where: { userId: context.userId, start: { gte: new Date() } },
          orderBy: { start: "asc" },
          take: 5,
          select: { id: true, title: true, start: true, end: true, source: true },
        }),
        prisma.activityLog.findMany({
          where: { userId: context.userId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, action: true, details: true, createdAt: true },
        }),
      ]);

      return jsonResource(uri, {
        user,
        mcpContext: {
          userId: context.userId,
          email: context.email,
          role: context.role,
          binding: "bearer-token",
        },
        dashboardCounts: {
          activeMailboxes: emailAccounts,
          leads,
          customers,
          campaigns,
          activeCampaigns,
          forms,
          formSubmissions,
          calendarEvents,
        },
        upcomingEvents,
        recentActivity,
        notes: [
          "Tools in this MCP session write to the dashboard records owned by mcpContext.userId.",
          "Admin tools are available only when mcpContext.role is ADMIN.",
          "Hosted MCP clients only need the HTTPS endpoint and Authorization bearer token.",
          "Secrets are not included in this snapshot.",
        ],
      });
    }
  );
}
