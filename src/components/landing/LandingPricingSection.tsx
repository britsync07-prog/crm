"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import type { PublicPricingPlan, PricingOffer } from "@/lib/pricing";

const defaultPlans = [
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
      "Email Sync (Gmail/Outlook)",
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
      "Activity Dashboard",
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
      "24/7 Phone Support",
    ],
    activeOffer: null,
    discountedMonthlyPriceCents: null,
  },
];

export default function LandingPricingSection() {
  const [plans, setPlans] = useState<any[]>(defaultPlans);
  const [featuredOffer, setFeaturedOffer] = useState<PricingOffer | null>(null);

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.plans) && data.plans.length > 0) {
          setPlans(data.plans);
        }
        if (data.featuredOffer) {
          setFeaturedOffer(data.featuredOffer);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section id="pricing" className="container mx-auto px-6 py-40 space-y-16">
      <div className="text-center space-y-6">
        {featuredOffer && (
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-5 py-2 text-xs font-black uppercase tracking-wider text-red-200 shadow-md">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>
              Special Promotion: {featuredOffer.title} ({featuredOffer.discountPercent}% OFF)
            </span>
          </div>
        )}
        <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase italic">
          The Economics.
        </h2>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-medium tracking-tight">
          Choose the plan that fits your team. Upgrade anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((p) => {
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
          const seatLabel = p.seatLimit ? `${p.seatLimit} seats` : "Unlimited seats";

          return (
            <div
              key={p.slug}
              className={`p-10 rounded-[40px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                p.isPopular
                  ? "bg-[#012169] text-white shadow-[0_40px_100px_-20px_rgba(79,70,229,0.6)] scale-105"
                  : "bg-white/5 border border-white/10 hover:border-white/20"
              }`}
            >
              {p.isPopular && (
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Sparkles className="w-32 h-32 rotate-12" />
                </div>
              )}
              <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`text-2xl font-black italic ${p.isPopular ? "text-white" : ""}`}>
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
                      <span className="text-lg font-black text-red-300 line-through">
                        {originalPrice}
                      </span>
                      <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        {p.activeOffer?.discountPercent}% OFF
                      </span>
                    </div>
                  )}
                  <div className="flex items-end gap-1">
                    <span className={`text-5xl font-black ${p.isPopular ? "text-white" : ""}`}>
                      {currentPrice}
                    </span>
                    {!isCustom && (
                      <span
                        className={`font-bold mb-2 text-sm ${
                          p.isPopular ? "text-blue-200" : "text-zinc-400"
                        }`}
                      >
                        /mo
                      </span>
                    )}
                  </div>
                  {p.activeOffer?.couponCode && (
                    <p className="text-xs font-bold text-amber-300">
                      Code: {p.activeOffer.couponCode}
                    </p>
                  )}
                </div>

                <div className={`h-px ${p.isPopular ? "bg-white/20" : "bg-white/10"}`} />
                <ul className="space-y-4">
                  {p.features.map((f: string) => (
                    <li
                      key={f}
                      className={`flex items-center gap-3 text-[13px] font-bold ${
                        p.isPopular ? "text-white" : "text-zinc-300"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          p.isPopular ? "text-white" : "text-[#012169]"
                        }`}
                      />{" "}
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={p.slug === "enterprise" ? "mailto:sales@britsyncai.com" : `/signup?plan=${p.slug}`}
                className={`w-full mt-10 py-5 rounded-[20px] text-center font-black uppercase tracking-[0.2em] text-[10px] transition-all ${
                  p.isPopular
                    ? "bg-white text-[#012169] hover:scale-95 shadow-2xl"
                    : "bg-[#012169] text-white hover:bg-[#012169]/90"
                }`}
              >
                {p.slug === "enterprise" ? "Contact Sales" : "Start 3-Day Free Trial"}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          ⚡ All plans include an automatic 3-day free trial. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
