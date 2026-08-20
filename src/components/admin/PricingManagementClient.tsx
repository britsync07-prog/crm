"use client";

import { useActionState } from "react";
import { CalendarDays, DollarSign, Percent, Save, Sparkles } from "lucide-react";
import { savePricingOfferAction, savePricingPlanAction } from "@/app/admin/admin-actions";
import type { PricingOffer, PricingPlan } from "@/lib/pricing";

const initialState = { success: false, error: null };

function money(cents: number | null) {
  return cents === null ? "Custom" : String(cents / 100);
}

function localInputValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function PlanForm({ plan }: { plan: PricingPlan }) {
  const [state, action, pending] = useActionState(savePricingPlanAction, initialState);

  return (
    <form action={action} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <input type="hidden" name="id" value={plan.id} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-lg font-black text-zinc-900 dark:text-zinc-50">{plan.name}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{plan.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <input type="checkbox" name="isActive" defaultChecked={plan.isActive} className="accent-[#012169]" />
            Active
          </label>
          <label className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#012169] dark:bg-blue-950/30 dark:text-blue-200">
            <input type="checkbox" name="isPopular" defaultChecked={plan.isPopular} className="accent-[#012169]" />
            Featured
          </label>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Slug
          <input name="slug" defaultValue={plan.slug} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Name
          <input name="name" defaultValue={plan.name} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Monthly Price
          <input name="monthlyPrice" defaultValue={money(plan.monthlyPriceCents)} inputMode="decimal" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Seats
          <input name="seatLimit" defaultValue={plan.seatLimit ?? "Unlimited"} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Trial Days
          <input name="trialDays" defaultValue={plan.trialDays} inputMode="numeric" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Sort Order
          <input name="sortOrder" defaultValue={plan.sortOrder} inputMode="numeric" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500 md:col-span-2">
          Description
          <input name="description" defaultValue={plan.description} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Button Label
          <input name="ctaLabel" defaultValue={plan.ctaLabel || ""} placeholder="Subscribe" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Stripe Price ID
          <input name="stripePriceId" defaultValue={plan.stripePriceId || ""} placeholder="Optional" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500 md:col-span-2">
          Features
          <textarea name="features" defaultValue={plan.features.join("\n")} rows={6} className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs font-bold ${state.error ? "text-red-600" : state.success ? "text-green-600" : "text-zinc-400"}`}>
          {state.error || (state.success ? "Saved" : "Changes affect public pricing and checkout.")}
        </p>
        <button disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#012169] px-4 py-3 text-xs font-black uppercase tracking-wider text-white disabled:opacity-60">
          <Save className="h-4 w-4" />
          Save Plan
        </button>
      </div>
    </form>
  );
}

function NewOfferForm({ plans }: { plans: PricingPlan[] }) {
  const [state, action, pending] = useActionState(savePricingOfferAction, initialState);

  return (
    <form action={action} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c8102e] text-white">
          <Percent className="h-5 w-5" />
        </div>
        <div>
          <p className="font-black text-zinc-900 dark:text-zinc-50">Create Offer</p>
          <p className="text-xs font-medium text-zinc-500">Show a discount event on the pricing page.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <input name="title" placeholder="August growth offer" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        <input name="discountPercent" placeholder="Discount %" inputMode="numeric" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        <input name="couponCode" placeholder="Coupon code shown to users" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        <select name="appliesToPlanSlug" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white">
          <option value="">All paid plans</option>
          {plans.map((plan) => <option key={plan.slug} value={plan.slug}>{plan.name}</option>)}
        </select>
        <input name="startsAt" type="datetime-local" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        <input name="endsAt" type="datetime-local" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        <textarea name="description" placeholder="Short banner message" rows={3} className="resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white md:col-span-2" />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">
          <input name="isActive" type="checkbox" defaultChecked className="accent-[#012169]" />
          Active offer
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className={`text-xs font-bold ${state.error ? "text-red-600" : state.success ? "text-green-600" : "text-zinc-400"}`}>
            {state.error || (state.success ? "Offer saved" : "")}
          </p>
          <button disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-4 py-3 text-xs font-black uppercase tracking-wider text-white disabled:opacity-60">
            <Sparkles className="h-4 w-4" />
            Save Offer
          </button>
        </div>
      </div>
    </form>
  );
}

function OfferForm({ offer, plans }: { offer: PricingOffer; plans: PricingPlan[] }) {
  const [state, action, pending] = useActionState(savePricingOfferAction, initialState);

  return (
    <form action={action} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <input type="hidden" name="id" value={offer.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <input name="title" defaultValue={offer.title} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        <input name="discountPercent" defaultValue={offer.discountPercent} inputMode="numeric" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        <input name="couponCode" defaultValue={offer.couponCode || ""} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        <select name="appliesToPlanSlug" defaultValue={offer.appliesToPlanSlug || ""} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white">
          <option value="">All paid plans</option>
          {plans.map((plan) => <option key={plan.slug} value={plan.slug}>{plan.name}</option>)}
        </select>
        <input name="startsAt" type="datetime-local" defaultValue={localInputValue(offer.startsAt)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        <input name="endsAt" type="datetime-local" defaultValue={localInputValue(offer.endsAt)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
        <textarea name="description" defaultValue={offer.description} rows={3} className="resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white md:col-span-2" />
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">
          <input name="isActive" type="checkbox" defaultChecked={offer.isActive} className="accent-[#012169]" />
          Active
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className={`text-xs font-bold ${state.error ? "text-red-600" : state.success ? "text-green-600" : "text-zinc-400"}`}>
            {state.error || (state.success ? "Offer saved" : `${offer.discountPercent}% off ${offer.appliesToPlanSlug || "all paid plans"}`)}
          </p>
          <button disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#012169] px-4 py-3 text-xs font-black uppercase tracking-wider text-white disabled:opacity-60">
            <Save className="h-4 w-4" />
            Save Offer
          </button>
        </div>
      </div>
    </form>
  );
}

export default function PricingManagementClient({ plans, offers }: { plans: PricingPlan[]; offers: PricingOffer[] }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <DollarSign className="mb-3 h-5 w-5 text-[#012169]" />
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{plans.length}</p>
          <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Plans</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <Percent className="mb-3 h-5 w-5 text-[#c8102e]" />
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{offers.filter((offer) => offer.isActive).length}</p>
          <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Active Offers</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <CalendarDays className="mb-3 h-5 w-5 text-emerald-600" />
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{Math.max(...plans.map((plan) => plan.trialDays), 0)}</p>
          <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Max Trial Days</p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Plans</h2>
        <div className="grid gap-5 xl:grid-cols-2">
          {plans.map((plan) => <PlanForm key={plan.id} plan={plan} />)}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Offers & Events</h2>
        <NewOfferForm plans={plans} />
        <div className="grid gap-5 xl:grid-cols-2">
          {offers.map((offer) => <OfferForm key={offer.id} offer={offer} plans={plans} />)}
        </div>
      </section>
    </div>
  );
}
