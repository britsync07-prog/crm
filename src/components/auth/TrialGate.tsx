"use client";

import { usePathname } from "next/navigation";
import TrialExpiredPaywall from "@/components/billing/TrialExpiredPaywall";
import type { SubscriptionStatusInfo } from "@/lib/subscription";

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
  const isPublicRoute =
    pathname === "/landing" ||
    pathname === "/pricing" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/contact" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname.startsWith("/features/") ||
    pathname.startsWith("/solutions/") ||
    pathname.startsWith("/vision/") ||
    pathname.startsWith("/mcp/docs") ||
    pathname.startsWith("/f/") ||
    pathname.startsWith("/meet/") ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/onboarding/portal/") ||
    pathname.startsWith("/onboarding/sign/");

  // If subscription is expired and user attempts to access any internal CRM tool
  if (subscription.isExpired && !isPublicRoute) {
    return <TrialExpiredPaywall />;
  }

  return <>{children}</>;
}
