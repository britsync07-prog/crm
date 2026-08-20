import { DollarSign } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getAdminPricingAction } from "../admin-actions";
import PricingManagementClient from "@/components/admin/PricingManagementClient";

export default async function AdminPricingPage() {
  await requireAdmin();
  const { plans, offers } = await getAdminPricingAction();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#012169] shadow-lg shadow-blue-900/20">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">Pricing Control</h1>
            <p className="text-sm font-medium text-zinc-500">Manage plans, discounts, promotional events, and trial periods.</p>
          </div>
        </div>
      </div>

      <PricingManagementClient plans={plans} offers={offers} />
    </div>
  );
}
