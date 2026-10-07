import { requireAdmin } from "@/lib/admin-guard";
import { getAdminReferralsAction } from "../admin-actions";
import ReferralsManagementClient from "@/components/admin/ReferralsManagementClient";
import { getAppBaseUrl } from "@/lib/app-url";
import { Share2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReferralsPage() {
  await requireAdmin();
  const { overview, links } = await getAdminReferralsAction();
  const baseUrl = getAppBaseUrl();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c8102e] to-[#012169] shadow-lg shadow-red-900/20">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Agency & Referral Marketing
            </h1>
            <p className="text-sm font-medium text-zinc-500">
              Track link clicks, signups, paid client conversions, and revenue attribution across marketing agencies.
            </p>
          </div>
        </div>
      </div>

      <ReferralsManagementClient
        initialOverview={overview}
        initialLinks={links}
        baseUrl={baseUrl}
      />
    </div>
  );
}
