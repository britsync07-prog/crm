import { prisma } from "@/lib/db";

export type SubscriptionStatusInfo = {
  isExpired: boolean;
  isTrial: boolean;
  isActive: boolean;
  isAdmin: boolean;
  plan: string;
  subscriptionStatus: string;
  subscriptionEndDate: Date | null;
  daysRemaining: number;
  organizationId: string | null;
  organizationName: string | null;
};

export async function getUserSubscription(userId: string): Promise<SubscriptionStatusInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      organizationId: true,
      ownedOrganization: {
        select: {
          id: true,
          name: true,
          plan: true,
          subscriptionStatus: true,
          subscriptionEndDate: true,
          createdAt: true,
        },
      },
      memberProfile: {
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              plan: true,
              subscriptionStatus: true,
              subscriptionEndDate: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  // Admin always has full access
  if (!user || user.role === "ADMIN") {
    return {
      isExpired: false,
      isTrial: false,
      isActive: true,
      isAdmin: user?.role === "ADMIN",
      plan: "enterprise",
      subscriptionStatus: "active",
      subscriptionEndDate: null,
      daysRemaining: 9999,
      organizationId: user?.organizationId ?? null,
      organizationName: "Admin System",
    };
  }

  const org = user.ownedOrganization || user.memberProfile?.organization;

  // If no organization found, user cannot use CRM
  if (!org) {
    return {
      isExpired: true,
      isTrial: false,
      isActive: false,
      isAdmin: false,
      plan: "none",
      subscriptionStatus: "expired",
      subscriptionEndDate: null,
      daysRemaining: 0,
      organizationId: null,
      organizationName: null,
    };
  }

  const now = new Date();
  const rawStatus = (org.subscriptionStatus || "").toLowerCase();
  const rawPlan = (org.plan || "").toLowerCase();

  // Paid active subscriptions
  if (rawStatus === "active") {
    return {
      isExpired: false,
      isTrial: false,
      isActive: true,
      isAdmin: false,
      plan: rawPlan,
      subscriptionStatus: "active",
      subscriptionEndDate: org.subscriptionEndDate,
      daysRemaining: org.subscriptionEndDate
        ? Math.max(0, Math.ceil((org.subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 9999,
      organizationId: org.id,
      organizationName: org.name,
    };
  }

  // Explicitly expired or canceled
  if (rawStatus === "expired" || rawStatus === "canceled") {
    return {
      isExpired: true,
      isTrial: false,
      isActive: false,
      isAdmin: false,
      plan: rawPlan,
      subscriptionStatus: rawStatus,
      subscriptionEndDate: org.subscriptionEndDate,
      daysRemaining: 0,
      organizationId: org.id,
      organizationName: org.name,
    };
  }

  // Trial status (or legacy "free" which is treated under the 3-day trial rule)
  let endDate = org.subscriptionEndDate;

  // If legacy "free" plan with no explicit end date, calculate from org creation date + 3 days
  if (!endDate) {
    endDate = new Date(org.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);
  }

  const msRemaining = endDate.getTime() - now.getTime();
  const isExpired = msRemaining <= 0;
  const daysRemaining = isExpired ? 0 : Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  return {
    isExpired,
    isTrial: true,
    isActive: !isExpired,
    isAdmin: false,
    plan: rawPlan === "free" ? "personal" : rawPlan,
    subscriptionStatus: isExpired ? "expired" : "trial",
    subscriptionEndDate: endDate,
    daysRemaining,
    organizationId: org.id,
    organizationName: org.name,
  };
}

export async function assertActiveSubscription(userId: string) {
  const sub = await getUserSubscription(userId);
  if (sub.isExpired) {
    throw new Error("Your 3-day trial has expired. Please choose a subscription plan to continue.");
  }
  return sub;
}
