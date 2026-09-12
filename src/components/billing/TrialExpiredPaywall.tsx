"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/auth-actions";
import {
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Loader2,
  LogOut,
  ArrowRight,
  Headphones,
} from "lucide-react";
import type { PublicPricingPlan, PricingOffer } from "@/lib/pricing";

export default function TrialExpiredPaywall() {
  const router = useRouter();
  const [plans, setPlans] = useState<PublicPricingPlan[]>([]);
  const [featuredOffer, setFeaturedOffer] = useState<PricingOffer | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.plans)) setPlans(data.plans);
        if (data.featuredOffer) setFeaturedOffer(data.featuredOffer);
      })
      .catch(() => {});
  }, []);

  async function handleSubscribe(plan: PublicPricingPlan) {
    if (plan.monthlyPriceCents === null) {
      window.location.assign("mailto:sales@britsyncai.com");
      return;
    }

    setLoadingPlan(plan.slug);
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
        alert(data.error || "Unable to start checkout. Please contact support.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to initiate upgrade checkout.");
    }
    setLoadingPlan(null);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutAction();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#030303] text-white flex flex-col items-center justify-start overflow-y-auto px-4 py-12 sm:py-16 selection:bg-[#012169] selection:text-white">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#012169]/20 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl w-full space-y-10">
        {/* Header badge & title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-5 py-2 text-xs font-black uppercase tracking-wider text-red-300 shadow-lg">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>3-Day Free Trial Expired</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase italic tracking-tight text-white">
            Your Free Trial Has Ended
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base font-medium text-zinc-400 leading-relaxed">
            Your 3-day access to BritCRM has concluded. Choose a subscription plan below to immediately restore full
            access to your contacts, pipeline deals, emails, automations, and team workspace.
          </p>

          {/* Featured active promotion from admin */}
          {featuredOffer && (
            <div className="max-w-xl mx-auto p-4 rounded-2xl bg-gradient-to-r from-red-600/30 via-[#012169]/40 to-blue-900/30 border border-red-500/40 text-center space-y-1 shadow-md">
              <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>Special Promotion Active</span>
              </div>
              <p className="text-sm font-bold text-white">
                {featuredOffer.title} — Save {featuredOffer.discountPercent}% today!
              </p>
              {featuredOffer.couponCode && (
                <p className="text-xs text-blue-200 font-mono">
                  Coupon Code: <strong className="text-white uppercase">{featuredOffer.couponCode}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Pricing Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {(plans.length > 0
            ? plans
            : [
                {
                  slug: "personal",
                  name: "Personal",
                  monthlyPriceCents: 7900,
                  seatLimit: 2,
                  isPopular: false,
                  features: [
                    "50,000 Contacts",
                    "Unified Email Inbox",
                    "Pipeline Deal Tracking",
                    "Contact Timeline",
                    "Task Automation",
                    "Team Collaboration",
                  ],
                  activeOffer: null,
                  discountedMonthlyPriceCents: 7900,
                },
                {
                  slug: "business",
                  name: "Business",
                  monthlyPriceCents: 14900,
                  seatLimit: 5,
                  isPopular: true,
                  features: [
                    "Everything in Personal",
                    "5 Team Members",
                    "Advanced Pipeline Views",
                    "AI-Powered Insights",
                    "Custom Stages & Fields",
                    "Priority Support",
                  ],
                  activeOffer: null,
                  discountedMonthlyPriceCents: 14900,
                },
                {
                  slug: "enterprise",
                  name: "Enterprise",
                  monthlyPriceCents: null,
                  seatLimit: null,
                  isPopular: false,
                  features: [
                    "Everything in Business",
                    "Unlimited Team Members",
                    "SSO & SAML",
                    "Custom Integrations",
                    "Dedicated Success Manager",
                    "SLA Guarantee",
                  ],
                  activeOffer: null,
                  discountedMonthlyPriceCents: null,
                },
              ]
          ).map((p: any) => {
            const isCustom = p.monthlyPriceCents === null;
            const hasDiscount = Boolean(
              p.activeOffer && p.discountedMonthlyPriceCents !== p.monthlyPriceCents
            );
            const originalPrice = isCustom
              ? "Custom"
              : `$${Math.round((p.monthlyPriceCents || 0) / 100)}`;
            const currentPrice = isCustom
              ? "Custom"
              : hasDiscount
              ? `$${Math.round((p.discountedMonthlyPriceCents || 0) / 100)}`
              : originalPrice;
            const seatLabel = p.seatLimit ? `${p.seatLimit} seats included` : "Unlimited seats";

            return (
              <div
                key={p.slug}
                className={`p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                  p.isPopular
                    ? "bg-[#012169] text-white shadow-[0_30px_90px_-20px_rgba(79,70,229,0.7)] ring-2 ring-blue-400/50"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                {p.isPopular && (
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Sparkles className="w-24 h-24 rotate-12" />
                  </div>
                )}

                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className={`text-xl font-black italic ${p.isPopular ? "text-white" : ""}`}>
                        {p.name}
                      </h3>
                      <p
                        className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                          p.isPopular ? "text-blue-200" : "text-zinc-500"
                        }`}
                      >
                        {seatLabel}
                      </p>
                    </div>
                    {p.isPopular && (
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                        Best Value
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {hasDiscount && (
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-red-300 line-through">
                          {originalPrice}
                        </span>
                        <span className="bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                          {p.activeOffer?.discountPercent}% OFF
                        </span>
                      </div>
                    )}
                    <div className="flex items-end gap-1">
                      <span className={`text-4xl font-black ${p.isPopular ? "text-white" : ""}`}>
                        {currentPrice}
                      </span>
                      {!isCustom && (
                        <span
                          className={`font-bold mb-1.5 text-xs ${
                            p.isPopular ? "text-blue-200" : "text-zinc-400"
                          }`}
                        >
                          /mo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`h-px ${p.isPopular ? "bg-white/20" : "bg-white/10"}`} />

                  <ul className="space-y-3">
                    {p.features.map((f: string) => (
                      <li
                        key={f}
                        className={`flex items-center gap-2 text-xs font-bold ${
                          p.isPopular ? "text-white" : "text-zinc-300"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            p.isPopular ? "text-white" : "text-[#012169]"
                          }`}
                        />{" "}
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribe(p)}
                  disabled={loadingPlan !== null}
                  className={`w-full mt-8 py-4 rounded-2xl text-center font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                    p.isPopular
                      ? "bg-white text-[#012169] hover:scale-98 shadow-xl"
                      : "bg-[#012169] text-white hover:bg-[#012169]/90"
                  }`}
                >
                  {loadingPlan === p.slug ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCustom ? (
                    "Contact Sales"
                  ) : (
                    <>
                      <span>Upgrade to {p.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom actions: Logout & Support */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10 text-xs text-zinc-500">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white font-bold transition-colors disabled:opacity-50"
          >
            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Sign Out
          </button>

          <div className="flex items-center gap-4">
            <a
              href="mailto:support@britsyncai.com"
              className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold transition-colors"
            >
              <Headphones className="w-4 h-4" />
              Contact Support
            </a>
            <span>&middot;</span>
            <button
              onClick={() => router.push("/pricing")}
              className="text-zinc-400 hover:text-white underline font-bold"
            >
              Compare All Features
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
