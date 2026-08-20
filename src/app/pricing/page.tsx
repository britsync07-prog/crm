"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import type { PublicPricingPlan } from "@/lib/pricing";

function formatPrice(cents: number | null) {
  if (cents === null) return "Custom";
  return `$${Math.round(cents / 100)}`;
}

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PublicPricingPlan[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<string>("free");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((data) => setPlans(data.plans || []))
      .catch(() => setPlans([]));

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setUserId(data.id);
        setSubStatus(data.subscriptionStatus || "free");
      })
      .catch(() => {});
  }, []);

  async function handleSubscribe(plan: PublicPricingPlan) {
    if (!userId) {
      router.push("/signup");
      return;
    }
    if (plan.monthlyPriceCents === null) {
      window.location.assign("mailto:sales@britsyncai.com");
      return;
    }
    setLoading(plan.slug);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.slug }),
      });
      const data = await res.json();
      if (data.url) window.location.assign(data.url);
    } catch (err) {
      console.error(err);
    }
    setLoading(null);
  }

  const isSubscribed = subStatus === "active" || subStatus === "trialing";
  const featuredOffer = plans.find((plan) => plan.activeOffer)?.activeOffer;
  const defaultTrialDays = plans.length ? Math.max(...plans.map((plan) => plan.trialDays), 0) : 14;

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-16 sm:px-6 sm:py-24 lg:space-y-16 lg:py-32">
        <div className="mx-auto max-w-3xl space-y-5 text-center">
          {featuredOffer && (
            <div className="mx-auto inline-flex max-w-full items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-100">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="truncate">{featuredOffer.title}: {featuredOffer.discountPercent}% off</span>
            </div>
          )}
          <h1 className="text-4xl font-black uppercase italic tracking-tight sm:text-6xl lg:text-7xl">Simple Pricing</h1>
          <p className="mx-auto max-w-2xl text-base font-medium text-zinc-400 sm:text-xl">
            Choose the plan that fits your team. Upgrade anytime.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCustom = plan.monthlyPriceCents === null;
            const hasDiscount = plan.activeOffer && plan.discountedMonthlyPriceCents !== plan.monthlyPriceCents;
            const price = formatPrice(hasDiscount ? plan.discountedMonthlyPriceCents : plan.monthlyPriceCents);

            return (
              <div
                key={plan.slug}
                className={`relative flex min-w-0 flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-xl sm:p-8 ${
                  plan.isPopular
                    ? "bg-[#012169] text-white shadow-[0_30px_80px_-30px_rgba(79,70,229,0.75)]"
                    : "border border-white/10 bg-white/5"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute right-4 top-4 opacity-10">
                    <Sparkles className="h-24 w-24 rotate-12" />
                  </div>
                )}
                <div className="relative z-10 space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-2xl font-black italic">{plan.name}</h2>
                      <p className={`mt-1 text-xs font-black uppercase tracking-wider ${plan.isPopular ? "text-blue-200" : "text-zinc-500"}`}>
                        {plan.seatLimit ? `${plan.seatLimit} seats included` : "Unlimited seats"}
                      </p>
                    </div>
                    {plan.isPopular && (
                      <span className="w-fit rounded-full bg-white/20 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider">
                        Best Value
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {hasDiscount && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl font-black text-blue-100 line-through">{formatPrice(plan.monthlyPriceCents)}</span>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#c8102e]">
                          {plan.activeOffer?.discountPercent}% off
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-end gap-1">
                      <span className="text-5xl font-black">{price}</span>
                      {!isCustom && <span className={`mb-2 text-sm font-bold ${plan.isPopular ? "text-blue-200" : "text-zinc-400"}`}>/mo</span>}
                    </div>
                    {plan.activeOffer?.couponCode && (
                      <p className="text-xs font-bold text-blue-100">Code: {plan.activeOffer.couponCode}</p>
                    )}
                  </div>

                  <p className={`text-sm font-medium ${plan.isPopular ? "text-blue-100" : "text-zinc-500"}`}>{plan.description}</p>
                  <div className={`h-px ${plan.isPopular ? "bg-white/20" : "bg-white/10"}`} />
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className={`flex items-start gap-3 text-sm font-bold ${plan.isPopular ? "text-white" : "text-zinc-300"}`}>
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${plan.isPopular ? "text-white" : "text-blue-300"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading !== null}
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-2xl px-4 py-4 text-center text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 ${
                    plan.isPopular
                      ? "bg-white text-[#012169] hover:scale-[0.98]"
                      : "bg-[#012169] text-white hover:bg-[#012169]/90"
                  }`}
                >
                  {loading === plan.slug ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : !userId ? (
                    `Start ${plan.trialDays || defaultTrialDays}-day trial`
                  ) : isSubscribed ? (
                    "Already subscribed"
                  ) : isCustom ? (
                    "Contact sales"
                  ) : (
                    plan.ctaLabel || "Subscribe"
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mx-auto max-w-lg text-center">
          <p className="text-sm font-medium text-zinc-500">
            {defaultTrialDays > 0 ? `Plans include up to a ${defaultTrialDays}-day free trial.` : "Free trial settings are managed by the admin team."} Cancel anytime.
          </p>
          <Link href="/landing#faq" className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-300">
            Have questions? <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
