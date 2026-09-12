"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Sparkles,
  CheckCircle2,
  Loader2,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
} from "lucide-react";
import type { PublicPricingPlan } from "@/lib/pricing";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysRemaining?: number;
  currentPlan?: string;
}

function formatPrice(cents: number | null) {
  if (cents === null) return "Custom";
  return `$${Math.round(cents / 100)}`;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  daysRemaining = 3,
  currentPlan = "personal",
}: UpgradeModalProps) {
  const [plans, setPlans] = useState<PublicPricingPlan[]>([]);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetch("/api/pricing")
        .then((r) => r.json())
        .then((data) => setPlans(data.plans || []))
        .catch(() => setPlans([]));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const featuredOffer = plans.find((p) => p.activeOffer)?.activeOffer;

  async function handleUpgrade(plan: PublicPricingPlan) {
    if (plan.monthlyPriceCents === null) {
      window.location.assign("mailto:sales@britsyncai.com");
      return;
    }

    setLoadingSlug(plan.slug);
    setError(null);

    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.slug }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        setError(data.error || "Failed to start checkout session.");
      }
    } catch (err: any) {
      console.error(err);
      setError("An unexpected network error occurred.");
    } finally {
      setLoadingSlug(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0b0f19] border border-slate-800 text-white rounded-[32px] w-full max-w-4xl p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-widest">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Trial Status: {daysRemaining} Day{daysRemaining === 1 ? "" : "s"} Left</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight">
            Upgrade Your BritCRM Plan
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Lock in uninterrupted access to all your CRM features, pipelines, automations, and mailboxes.
          </p>
        </div>

        {/* Featured Offer Banner */}
        {featuredOffer && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-500/20 via-[#012169]/30 to-blue-500/20 border border-red-500/40 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Special Offer: {featuredOffer.title} ({featuredOffer.discountPercent}% OFF)</span>
            </div>
            {featuredOffer.couponCode && (
              <p className="text-xs text-slate-300">
                Discount automatically applied at checkout with code: <strong className="text-white font-mono">{featuredOffer.couponCode}</strong>
              </p>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCustom = plan.monthlyPriceCents === null;
            const hasDiscount = plan.activeOffer && plan.discountedMonthlyPriceCents !== plan.monthlyPriceCents;
            const displayPrice = formatPrice(hasDiscount ? plan.discountedMonthlyPriceCents : plan.monthlyPriceCents);
            const originalPrice = formatPrice(plan.monthlyPriceCents);

            return (
              <div
                key={plan.slug}
                className={`relative rounded-3xl p-5 flex flex-col justify-between transition-all ${
                  plan.isPopular
                    ? "bg-[#012169] border-2 border-blue-400/60 shadow-xl shadow-blue-900/30"
                    : "bg-slate-900/80 border border-slate-800 hover:border-slate-700"
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-400 text-[#012169] text-[9px] font-black uppercase tracking-wider shadow">
                    Most Popular
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight text-white">
                      {plan.name}
                    </h3>
                    <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white">{displayPrice}</span>
                    {!isCustom && <span className="text-xs text-slate-400 font-bold">/mo</span>}
                    {hasDiscount && (
                      <span className="text-xs line-through text-slate-400 ml-1">
                        {originalPrice}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2 text-xs">
                    {plan.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="line-clamp-1">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={loadingSlug !== null}
                  className={`mt-6 w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    plan.isPopular
                      ? "bg-white text-[#012169] hover:bg-slate-100 shadow-md"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  } disabled:opacity-50`}
                >
                  {loadingSlug === plan.slug ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCustom ? (
                    "Contact Sales"
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-center pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 gap-3">
          <div className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure 256-bit Stripe checkout. Cancel anytime.</span>
          </div>

          <Link
            href="/pricing"
            onClick={onClose}
            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 uppercase tracking-wider text-[11px]"
          >
            <span>View Full Pricing Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
