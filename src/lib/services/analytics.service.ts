import { prisma } from "@/lib/db";

export class AnalyticsService {
  /**
   * Calculate CRM Pipeline statistics for a user
   */
  static async getPipelineStats(userId: string) {
    const deals = await prisma.deal.findMany({
      where: { userId },
      select: {
        value: true,
        probability: true,
        stage: true,
        stageId: true,
      },
    });

    const totalDeals = deals.length;
    const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const weightedValue = deals.reduce(
      (sum, deal) => sum + (deal.value || 0) * ((deal.probability || 0) / 100),
      0
    );

    // Group by stage (using stageId if available, otherwise fallback to stage string)
    const stageDistribution: Record<string, number> = {};
    deals.forEach((deal) => {
      const s = deal.stageId || deal.stage || "Unknown";
      stageDistribution[s] = (stageDistribution[s] || 0) + 1;
    });

    return {
      totalDeals,
      totalValue,
      weightedValue,
      stageDistribution,
      averageDealValue: totalDeals > 0 ? totalValue / totalDeals : 0,
    };
  }

  /**
   * Calculate Lead Conversion metrics
   */
  static async getLeadConversionStats(userId: string) {
    const totalLeads = await prisma.lead.count({ where: { userId } });
    const totalCustomers = await prisma.customer.count({ where: { userId } });
    
    // We could also track specific conversions if we had a transition log, 
    // but for now, simple counts or checking lead status.
    const convertedLeads = await prisma.lead.count({
      where: { userId, status: "Converted" }, // Assuming "Converted" is a status
    });

    return {
      totalLeads,
      totalCustomers,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
    };
  }

  /**
   * Calculate Financial Metrics (MRR, Total Revenue, etc.)
   */
  static async getFinancialStats(userId: string) {
    // 1. Total Revenue from Paid Invoices
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        customer: { userId },
        status: "Paid",
      },
      select: { amount: true },
    });
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // 2. Pending Revenue (Unpaid Invoices)
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        customer: { userId },
        status: { in: ["Sent", "Draft"] },
      },
      select: { amount: true },
    });
    const pendingRevenue = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // 3. Monthly Recurring Revenue (MRR) from active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        customer: { userId },
        status: "ACTIVE",
      },
      select: { amount: true, interval: true },
    });

    const mrr = activeSubscriptions.reduce((sum, sub) => {
      if (sub.interval === "YEARLY") return sum + sub.amount / 12;
      return sum + sub.amount;
    }, 0);

    return {
      totalRevenue,
      pendingRevenue,
      mrr,
      activeSubscriptionsCount: activeSubscriptions.length,
    };
  }

  /**
   * Activity & Engagement metrics
   */
  static async getActivityStats(userId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    const [interactions, completedTasks, campaigns] = await Promise.all([
      prisma.interaction.count({
        where: {
          OR: [
            { customer: { userId } },
            { lead: { userId } },
          ],
          date: { gte: thirtyDaysAgo },
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { in: ["Done", "Completed"] },
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.campaign.count({
        where: { userId, status: "Active" },
      }),
    ]);

    return {
      recentInteractions: interactions,
      completedTasks30d: completedTasks,
      activeCampaigns: campaigns,
    };
  }
}
