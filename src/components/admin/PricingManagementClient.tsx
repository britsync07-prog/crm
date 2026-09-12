"use client";

import { useState, useActionState, useTransition } from "react";
import {
  CalendarDays,
  DollarSign,
  Percent,
  Save,
  Sparkles,
  Trash2,
  CheckCircle,
  Eye,
  Tag,
} from "lucide-react";
import {
  savePricingOfferAction,
  savePricingPlanAction,
  deletePricingOfferAction,
  togglePricingOfferAction,
} from "@/app/admin/admin-actions";
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
    <form
      action={action}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900 space-y-4"
    >
      <input type="hidden" name="id" value={plan.id} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xl font-black text-zinc-900 dark:text-zinc-50">{plan.name}</p>
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

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Slug
          <input
            name="slug"
            defaultValue={plan.slug}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Name
          <input
            name="name"
            defaultValue={plan.name}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Monthly Price ($)
          <input
            name="monthlyPrice"
            defaultValue={money(plan.monthlyPriceCents)}
            inputMode="decimal"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Seats
          <input
            name="seatLimit"
            defaultValue={plan.seatLimit ?? "Unlimited"}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Default Trial Days
          <input
            name="trialDays"
            defaultValue={plan.trialDays}
            inputMode="numeric"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Sort Order
          <input
            name="sortOrder"
            defaultValue={plan.sortOrder}
            inputMode="numeric"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500 md:col-span-2">
          Description
          <input
            name="description"
            defaultValue={plan.description}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Button Label
          <input
            name="ctaLabel"
            defaultValue={plan.ctaLabel || ""}
            placeholder="Start 3-Day Trial"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Stripe Price ID
          <input
            name="stripePriceId"
            defaultValue={plan.stripePriceId || ""}
            placeholder="Optional (e.g. price_123...)"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500 md:col-span-2">
          Features (one per line)
          <textarea
            name="features"
            defaultValue={plan.features.join("\n")}
            rows={5}
            className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <p
          className={`text-xs font-bold ${
            state.error ? "text-red-600" : state.success ? "text-green-600" : "text-zinc-400"
          }`}
        >
          {state.error || (state.success ? "Plan saved successfully." : "Changes affect public pricing and signup.")}
        </p>
        <button
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#012169] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#012169]/90 disabled:opacity-60 transition-all shadow-sm"
        >
          <Save className="h-4 w-4" />
          Save Plan
        </button>
      </div>
    </form>
  );
}

function NewOfferForm({ plans }: { plans: PricingPlan[] }) {
  const [state, action, pending] = useActionState(savePricingOfferAction, initialState);
  const [discountVal, setDiscountVal] = useState<string>("20");
  const [startsAt, setStartsAt] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [endsAt, setEndsAt] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });

  function setPresetDiscount(pct: number) {
    setDiscountVal(String(pct));
  }

  function setPresetDuration(days: number) {
    const start = new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    setStartsAt(start.toISOString().slice(0, 16));
    setEndsAt(end.toISOString().slice(0, 16));
  }

  return (
    <form
      action={action}
      className="rounded-2xl border-2 border-red-500/20 bg-white p-6 shadow-md dark:border-red-500/30 dark:bg-zinc-900 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c8102e] text-white shadow-md">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-black text-zinc-900 dark:text-zinc-50">Create New Discount Offer</p>
            <p className="text-xs font-medium text-zinc-500">
              Active offers will automatically show on the front page (/landing and /pricing) with strikethrough prices.
            </p>
          </div>
        </div>
      </div>

      {/* Quick discount presets */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-bold text-zinc-400">Quick Discount %:</span>
        {[10, 20, 30, 40, 50].map((pct) => (
          <button
            type="button"
            key={pct}
            onClick={() => setPresetDiscount(pct)}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
              discountVal === String(pct)
                ? "bg-[#c8102e] text-white"
                : "bg-red-50 dark:bg-red-950/40 text-[#c8102e] hover:bg-red-100"
            }`}
          >
            {pct}% OFF
          </button>
        ))}
      </div>

      {/* Quick duration presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-zinc-400">Duration Presets:</span>
        {[
          { label: "3 Days", days: 3 },
          { label: "7 Days", days: 7 },
          { label: "14 Days", days: 14 },
          { label: "30 Days", days: 30 },
        ].map((item) => (
          <button
            type="button"
            key={item.days}
            onClick={() => setPresetDuration(item.days)}
            className="px-3 py-1 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Offer Title (Shows on Banner)
          <input
            name="title"
            required
            placeholder="e.g. Summer Launch Special"
            defaultValue="Special Limited Discount"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Discount Percentage (%)
          <input
            name="discountPercent"
            required
            value={discountVal}
            onChange={(e) => setDiscountVal(e.target.value)}
            placeholder="e.g. 25"
            inputMode="numeric"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white font-black text-red-600"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Coupon Code (Optional)
          <input
            name="couponCode"
            placeholder="e.g. SAVE25"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white uppercase font-bold"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Applies To Plan
          <select
            name="appliesToPlanSlug"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white font-bold"
          >
            <option value="">All paid plans</option>
            {plans.map((plan) => (
              <option key={plan.slug} value={plan.slug}>
                {plan.name} Only
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Start Date & Time
          <input
            name="startsAt"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          End Date & Time
          <input
            name="endsAt"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500 md:col-span-2">
          Banner Description / Announcement Text
          <textarea
            name="description"
            placeholder="e.g. Save 20% on all BritCRM subscriptions this week only!"
            defaultValue="Limited time promotional discount for new and upgrading teams."
            rows={2}
            className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">
          <input name="isActive" type="checkbox" defaultChecked className="accent-[#012169] w-4 h-4" />
          Make active immediately on front page
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p
            className={`text-xs font-bold ${
              state.error ? "text-red-600" : state.success ? "text-green-600" : "text-zinc-400"
            }`}
          >
            {state.error || (state.success ? "Offer created successfully!" : "")}
          </p>
          <button
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-60 transition-all shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            Publish Offer to Front Page
          </button>
        </div>
      </div>
    </form>
  );
}

function OfferForm({ offer, plans }: { offer: PricingOffer; plans: PricingPlan[] }) {
  const [state, action, pending] = useActionState(savePricingOfferAction, initialState);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isToggling, startToggleTransition] = useTransition();

  const isLive =
    offer.isActive &&
    new Date(offer.startsAt).getTime() <= Date.now() &&
    new Date(offer.endsAt).getTime() >= Date.now();

  function handleDelete() {
    if (!confirm(`Are you sure you want to delete the offer "${offer.title}"?`)) return;
    startDeleteTransition(async () => {
      await deletePricingOfferAction(offer.id);
    });
  }

  function handleToggle() {
    startToggleTransition(async () => {
      await togglePricingOfferAction(offer.id, !offer.isActive);
    });
  }

  return (
    <form
      action={action}
      className={`rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900 space-y-4 ${
        isLive ? "border-green-500/50 dark:border-green-500/40 ring-1 ring-green-500/20" : "border-zinc-200 dark:border-white/10"
      }`}
    >
      <input type="hidden" name="id" value={offer.id} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isLive ? "bg-green-500 animate-pulse" : offer.isActive ? "bg-amber-500" : "bg-zinc-400"
            }`}
          />
          <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50">
            {isLive ? "Live on Front Page" : offer.isActive ? "Active (Scheduled)" : "Inactive"}
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {offer.discountPercent}% OFF
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              offer.isActive
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/40 dark:text-green-300"
            }`}
          >
            {offer.isActive ? "Pause Offer" : "Activate"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="Delete Offer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Offer Title
          <input
            name="title"
            defaultValue={offer.title}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Discount Percentage (%)
          <input
            name="discountPercent"
            defaultValue={offer.discountPercent}
            inputMode="numeric"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-black text-red-600 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Coupon Code
          <input
            name="couponCode"
            defaultValue={offer.couponCode || ""}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold uppercase text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Applies To Plan
          <select
            name="appliesToPlanSlug"
            defaultValue={offer.appliesToPlanSlug || ""}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          >
            <option value="">All paid plans</option>
            {plans.map((plan) => (
              <option key={plan.slug} value={plan.slug}>
                {plan.name} Only
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          Start Date
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={localInputValue(offer.startsAt)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500">
          End Date
          <input
            name="endsAt"
            type="datetime-local"
            defaultValue={localInputValue(offer.endsAt)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-zinc-500 md:col-span-2">
          Banner Message
          <textarea
            name="description"
            defaultValue={offer.description}
            rows={2}
            className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">
          <input name="isActive" type="checkbox" defaultChecked={offer.isActive} className="accent-[#012169] w-4 h-4" />
          Active
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p
            className={`text-xs font-bold ${
              state.error ? "text-red-600" : state.success ? "text-green-600" : "text-zinc-400"
            }`}
          >
            {state.error ||
              (state.success
                ? "Offer updated!"
                : `${offer.discountPercent}% off ${offer.appliesToPlanSlug || "all plans"}`)}
          </p>
          <button
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#012169] px-5 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-[#012169]/90 disabled:opacity-60 transition-all shadow-sm"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </form>
  );
}

export default function PricingManagementClient({
  plans,
  offers,
}: {
  plans: PricingPlan[];
  offers: PricingOffer[];
}) {
  const activeOffers = offers.filter((offer) => {
    const now = Date.now();
    return (
      offer.isActive &&
      new Date(offer.startsAt).getTime() <= now &&
      new Date(offer.endsAt).getTime() >= now
    );
  });

  const featuredOffer = activeOffers[0] || null;

  return (
    <div className="space-y-10">
      {/* Top Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <DollarSign className="mb-3 h-5 w-5 text-[#012169]" />
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{plans.length}</p>
          <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Pricing Plans</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <Percent className="mb-3 h-5 w-5 text-[#c8102e]" />
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{activeOffers.length}</p>
          <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Active Front-Page Offers</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <CalendarDays className="mb-3 h-5 w-5 text-emerald-600" />
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">3 Days</p>
          <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Standard Free Trial</p>
        </div>
      </div>

      {/* Front-Page Live Preview Banner */}
      {featuredOffer ? (
        <div className="p-6 rounded-[24px] bg-gradient-to-r from-red-600 via-[#012169] to-blue-900 text-white shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-200">
            <Eye className="w-4 h-4" /> Live Front-Page Banner Preview
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xl font-black">
                🎉 {featuredOffer.title}: {featuredOffer.discountPercent}% OFF!
              </p>
              <p className="text-sm font-medium text-white/80">{featuredOffer.description}</p>
            </div>
            {featuredOffer.couponCode && (
              <div className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
                Code: {featuredOffer.couponCode}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-bold flex items-center gap-2">
          <Tag className="w-4 h-4" /> No active offer currently running on the front page. Create one below to show discounts to visitors!
        </div>
      )}

      {/* Section: Promotional Offers & Events */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Discounts & Offers</h2>
            <p className="text-xs text-zinc-500">
              Create discounts to display promotional banners and price markdowns on /landing and /pricing.
            </p>
          </div>
        </div>
        <NewOfferForm plans={plans} />
        {offers.length > 0 && (
          <div className="grid gap-5 xl:grid-cols-2">
            {offers.map((offer) => (
              <OfferForm key={offer.id} offer={offer} plans={plans} />
            ))}
          </div>
        )}
      </section>

      {/* Section: Pricing Plans */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Plans & Tiers</h2>
          <p className="text-xs text-zinc-500">
            Configure default prices, seat counts, features, and trial settings.
          </p>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          {plans.map((plan) => (
            <PlanForm key={plan.id} plan={plan} />
          ))}
        </div>
      </section>
    </div>
  );
}
