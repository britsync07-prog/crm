"use client";

import { usePathname } from "next/navigation";
import TrialExpiredPaywall from "@/components/billing/TrialExpiredPaywall";
import type { SubscriptionStatusInfo } from "@/lib/subscription";
import { isStandalonePublicRoute } from "@/lib/route-utils";

export default function TrialGate({
  children,
  subscription,
}: {
  children: React.ReactNode;
  subscription: SubscriptionStatusInfo | null;
}) {
  const pathname = usePathname();

  // If no subscription info or user is an admin, allow full access
  if (!subscription || subscription.isAdmin) {
    return <>{children}</>;
  }

  // Define public and marketing routes where paywall should not block browsing
  const isPublicRoute = isStandalonePublicRoute(pathname);

  // If subscription is expired and user attempts to access any internal CRM tool
  if (subscription.isExpired && !isPublicRoute) {
    return <TrialExpiredPaywall />;
  }

  return <>{children}</>;
}
