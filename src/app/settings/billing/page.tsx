"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import type { PublicPricingPlan } from "@/lib/pricing";

const PLAN_INFO: Record<string, { name: string; price: string; seats: number }> = {
  free: { name: "Free", price: "$0", seats: 1 },
  personal: { name: "Personal", price: "$79", seats: 2 },
  business: { name: "Business", price: "$149", seats: 5 },
  enterprise: { name: "Enterprise", price: "Custom", seats: -1 },
};

function BillingSettings() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("free");
  const [endDate, setEndDate] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("free");
  const [plans, setPlans] = useState<PublicPricingPlan[]>([]);
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((data) => setPlans(data.plans || []))
      .catch(() => setPlans([]));

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.subscriptionStatus || "free");
        setEndDate(data.subscriptionEndDate || null);
        setPlan(data.plan || "free");
      })
      .catch(() => {});
  }, []);

  async function handleSubscribe(planSlug: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planSlug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        alert(data.error || "Failed to initiate subscription checkout.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    }
    setLoading(false);
  }

  async function handleManage() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.assign(data.url);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const isActive = status === "active" || status === "trialing";
  const dynamicCurrentPlan = plans.find((item) => item.slug === plan);
  const currentPlan = dynamicCurrentPlan
    ? {
        name: dynamicCurrentPlan.name,
        price: dynamicCurrentPlan.monthlyPriceCents === null ? "Custom" : `$${Math.round(dynamicCurrentPlan.monthlyPriceCents / 100)}`,
        seats: dynamicCurrentPlan.seatLimit ?? -1,
      }
    : PLAN_INFO[plan] || PLAN_INFO.free;
  const upgradePlans = plans.length ? plans : [];

  return (
    <div className="space-y-12 sm:space-y-16 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {success && (
        <div className="p-6 rounded-3xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 flex items-center gap-4 text-green-800 dark:text-green-300 font-bold text-sm">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          Subscription activated! You now have full access.
        </div>
      )}
      {canceled && (
        <div className="p-6 rounded-3xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 flex items-center gap-4 text-yellow-800 dark:text-yellow-300 font-bold text-sm">
          Checkout canceled. No charges were made.
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#012169] flex items-center justify-center shadow-lg shadow-blue-900/20">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Billing & Subscription</h1>
            <p className="text-zinc-500 font-medium text-sm">Manage your plan and payment details</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl">
          <div className="p-6 sm:p-10 rounded-[28px] sm:rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="space-y-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black tracking-tight">{currentPlan.name}</h2>
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
                    isActive
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : status === "canceled"
                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  }`}>
                    {isActive ? "Active" : status === "canceled" ? "Canceled" : plan === "free" ? "Free" : status}
                  </span>
                </div>
                <p className="text-zinc-500 font-medium text-sm">
                  {isActive
                    ? `${currentPlan.seats > 0 ? `${currentPlan.seats} seats` : "Custom seats"} - all features included.`
                    : plan === "free"
                    ? "Free plan with 1 seat. Upgrade to unlock more."
                    : "Your subscription has ended."}
                </p>
                {endDate && (
                  <p className="text-zinc-400 text-xs font-medium">Current period ends: {new Date(endDate).toLocaleDateString()}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">{currentPlan.price}</p>
                {currentPlan.price !== "$0" && currentPlan.price !== "Custom" && (
                  <p className="text-zinc-400 text-xs font-bold">/month</p>
                )}
              </div>
            </div>

            <div className="h-px bg-zinc-200 dark:bg-white/10" />

            <ul className="space-y-4">
              {[
                "Unlimited AI Credits & Searches",
                "Unlimited SMTP Connections",
                "Visual Workflow Engine",
                "Sentiment AI Agents",
                "Unlimited Emails /mo",
                "Custom AI Training",
                "White-label Portal",
                "All Integrations & API Access",
                "Priority Support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm font-bold text-zinc-600 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-[#012169] shrink-0" /> {f}
                </li>
              ))}
            </ul>

            {isActive && (
              <button
                onClick={handleManage}
                disabled={loading}
                className="w-full py-5 rounded-[24px] bg-[#012169] text-white font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Manage in Stripe <ExternalLink className="w-3 h-3" /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {!isActive && plan !== "enterprise" && (
        <div className="space-y-8">
          <h2 className="text-2xl font-black tracking-tight">Upgrade your plan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {upgradePlans.map((p) => {
              const price = p.discountedMonthlyPriceCents !== p.monthlyPriceCents && p.discountedMonthlyPriceCents !== null
                ? `$${Math.round(p.discountedMonthlyPriceCents / 100)}`
                : p.monthlyPriceCents === null
                ? "Custom"
                : `$${Math.round(p.monthlyPriceCents / 100)}`;
              return (
              <div
                key={p.slug}
                className={`p-8 rounded-[24px] border-2 ${
                  p.isPopular
                    ? "bg-[#012169] text-white border-[#012169]"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10"
                } shadow-sm flex flex-col`}
              >
                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-black ${p.isPopular ? "text-white" : ""}`}>{p.name}</h3>
                    {p.isPopular && (
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] bg-white/20 px-3 py-1 rounded-full">
                        Best Value
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-black ${p.isPopular ? "text-white" : ""}`}>{price}</span>
                    {price !== "Custom" && (
                      <span className={`font-bold mb-1 text-xs ${p.isPopular ? "text-blue-200" : "text-zinc-400"}`}>/mo</span>
                    )}
                  </div>
                  {p.activeOffer && (
                    <p className={`text-xs font-black uppercase tracking-wider ${p.isPopular ? "text-blue-100" : "text-[#c8102e]"}`}>
                      {p.activeOffer.discountPercent}% off this month
                    </p>
                  )}
                  <p className={`text-sm font-medium ${p.isPopular ? "text-blue-200" : "text-zinc-500"}`}>
                    {p.seatLimit ? `${p.seatLimit} seats` : "Unlimited seats"}
                  </p>
                  <div className="h-px bg-zinc-200/20" />
                  <ul className="space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className={`flex items-center gap-2 text-sm font-bold ${p.isPopular ? "text-white" : "text-zinc-600"}`}>
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${p.isPopular ? "text-white" : "text-[#012169]"}`} /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => {
                    if (p.slug === "enterprise") {
                      window.location.assign("mailto:sales@britsyncai.com");
                    } else {
                      handleSubscribe(p.slug);
                    }
                  }}
                  disabled={loading}
                  className={`w-full mt-8 py-4 rounded-[16px] font-black uppercase tracking-[0.2em] text-[10px] transition-all disabled:opacity-50 ${
                    p.isPopular
                      ? "bg-white text-[#012169] hover:scale-[1.02]"
                      : "bg-[#012169] text-white hover:bg-[#012169]/90"
                  }`}
                >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : p.slug === "enterprise" ? "Contact Sales" : "Upgrade"}
                </button>
              </div>
            )})}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingSettingsPage() {
  return (
    <Suspense fallback={
      <div className="p-10 text-center font-bold text-sm text-zinc-500">
        Loading Billing configuration...
      </div>
    }>
      <BillingSettings />
    </Suspense>
  );
}
