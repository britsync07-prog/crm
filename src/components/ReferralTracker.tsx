"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ReferralTrackerInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode =
      searchParams.get("ref") ||
      searchParams.get("referral") ||
      searchParams.get("agency");

    if (!refCode) return;

    const cleanCode = refCode.trim().toLowerCase();
    const sessionKey = `britcrm_ref_tracked_${cleanCode}`;

    if (typeof window !== "undefined" && !sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "1");

      // Save cookie locally immediately
      document.cookie = `britcrm_ref=${encodeURIComponent(cleanCode)}; path=/; max-age=${90 * 24 * 60 * 60}; SameSite=Lax`;

      // Report visit to server
      fetch("/api/referrals/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          landingPath: window.location.pathname,
        }),
      }).catch(() => {
        // Silent catch for resilience
      });
    }
  }, [searchParams]);

  return null;
}

export default function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <ReferralTrackerInner />
    </Suspense>
  );
}
