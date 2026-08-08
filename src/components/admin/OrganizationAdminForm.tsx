"use client";

import { useActionState } from "react";
import { updateOrganizationAdminAction } from "@/app/admin/admin-actions";

const plans = ["free", "personal", "business", "enterprise"];
const statuses = ["free", "active", "trialing", "past_due", "canceled", "unpaid"];
const initialState = { success: false, error: null as string | null };

export function OrganizationAdminForm({
  organizationId,
  plan,
  subscriptionStatus,
  seatLimit,
}: {
  organizationId: string;
  plan: string;
  subscriptionStatus: string;
  seatLimit: number;
}) {
  const [state, formAction, pending] = useActionState(updateOrganizationAdminAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_120px_auto] xl:min-w-[620px]">
      <input type="hidden" name="organizationId" value={organizationId} />
      <select name="plan" defaultValue={plan} className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold">
        {plans.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <select name="subscriptionStatus" defaultValue={subscriptionStatus} className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold">
        {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <input
        name="seatLimit"
        type="number"
        min={1}
        max={1000}
        defaultValue={seatLimit}
        className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold"
      />
      <button
        disabled={pending}
        className="px-5 py-3 rounded-xl bg-[#012169] text-white text-[10px] font-black uppercase tracking-wider hover:bg-[#012169]/90 transition-colors disabled:opacity-50"
      >
        {pending ? "Saving" : "Save"}
      </button>
      {(state.error || state.success) && (
        <div className={`sm:col-span-4 text-xs font-bold ${state.error ? "text-red-600" : "text-green-600"}`}>
          {state.error || "Organization updated."}
        </div>
      )}
    </form>
  );
}
