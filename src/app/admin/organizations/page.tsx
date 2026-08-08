import { requireAdmin } from "@/lib/admin-guard";
import { getAdminOrganizationsAction } from "../admin-actions";
import { OrganizationAdminForm } from "@/components/admin/OrganizationAdminForm";
import { Building2, CreditCard, Search, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const query = params.query || "";
  const page = Math.max(1, Number(params.page || 1));
  const { organizations, total, totalPages } = await getAdminOrganizationsAction(query, page);

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#012169] flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Organizations</h1>
            <p className="text-zinc-500 font-medium text-sm">{total} SaaS workspaces and subscriptions</p>
          </div>
        </div>

        <form className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            name="query"
            defaultValue={query}
            placeholder="Search organization or owner"
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169] shadow-sm"
          />
        </form>
      </div>

      <div className="grid gap-5">
        {organizations.map((org) => {
          const activeMembers = org.members.filter((member) => member.status === "active").length;
          return (
            <div key={org.id} className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-white/10 shadow-sm p-6 space-y-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 truncate">{org.name}</h2>
                    <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      {org.plan}
                    </span>
                    <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {org.subscriptionStatus}
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm text-zinc-500">
                    <p>
                      Owner: <span className="font-bold text-zinc-800 dark:text-zinc-200">{org.owner.name || org.owner.email}</span>
                      <span className="text-zinc-400"> ({org.owner.email})</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="w-4 h-4" /> {activeMembers} active of {org.seatLimit} seats
                    </p>
                    <p className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Customer: {org.stripeCustomerId || "not linked"} · Subscription: {org.stripeSubscriptionId || "not linked"}
                    </p>
                  </div>
                </div>

                <OrganizationAdminForm
                  organizationId={org.id}
                  plan={org.plan}
                  subscriptionStatus={org.subscriptionStatus}
                  seatLimit={org.seatLimit}
                />
              </div>
            </div>
          );
        })}

        {organizations.length === 0 && (
          <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-white/10 text-zinc-400 font-medium">
            No organizations found.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm font-bold text-zinc-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-3">
            {page > 1 && <a className="px-4 py-2 rounded-xl bg-white border border-zinc-200" href={`/admin/organizations?query=${encodeURIComponent(query)}&page=${page - 1}`}>Previous</a>}
            {page < totalPages && <a className="px-4 py-2 rounded-xl bg-white border border-zinc-200" href={`/admin/organizations?query=${encodeURIComponent(query)}&page=${page + 1}`}>Next</a>}
          </div>
        </div>
      )}
    </div>
  );
}
