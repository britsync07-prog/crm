"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import TrialGate from "@/components/auth/TrialGate";
import { isStandalonePublicRoute } from "@/lib/route-utils";

interface CrmAppShellProps {
  children: React.ReactNode;
  session: any;
  subscription: any;
}

export default function CrmAppShell({
  children,
  session,
  subscription,
}: CrmAppShellProps) {
  const pathname = usePathname();
  const isPublic = isStandalonePublicRoute(pathname);

  // For public, standalone, or marketing routes:
  // Render clean children directly with zero CRM sidebar, zero top navbar,
  // zero trial paywall, and zero margin spacers.
  if (isPublic) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  // For authenticated internal CRM routes:
  // Render full dashboard layout with TrialGate, Sidebar, and TopNavbar.
  return (
    <TrialGate subscription={subscription}>
      <div className="flex min-h-screen">
        <Sidebar subscription={subscription} />
        <div className="flex-1 flex flex-col min-h-screen w-full">
          <TopNavbar session={session} subscription={subscription} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </TrialGate>
  );
}
