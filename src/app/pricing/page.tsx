"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Sparkles, ArrowRight, Loader2 } from "lucide-react";

const PLANS = [
  {
    slug: "personal",
    name: "Personal",
    price: "$79",
    desc: "For small teams getting started",
    seats: "2 seats included",
    best: false,
    features: [
      "Unlimited AI Sourcing Credits",
      "Unlimited AI Searches",
      "Unlimited SMTP Connections",
      "Visual Workflow Engine",
      "Sentiment AI Agents",
      "AI Writer & Cognitive SDR",
      "Unlimited Emails /mo",
      "Custom AI Training",
      "White-label Portal",
      "Enrichment API",
      "Complete CRM Suite",
      "Priority Support",
    ],
  },
  {
    slug: "business",
    name: "Business",
    price: "$149",
    desc: "For growing teams scaling up",
    seats: "5 seats included",
    best: true,
    features: [
      "Unlimited AI Sourcing Credits",
      "Unlimited AI Searches",
      "Unlimited SMTP Connections",
      "Visual Workflow Engine",
      "Sentiment AI Agents",
      "AI Writer & Cognitive SDR",
      "Unlimited Emails /mo",
      "Custom AI Training",
      "White-label Portal",
      "Enrichment API",
      "Complete CRM Suite",
      "Priority Support",
      "Activity Dashboard",
    ],
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    price: "Custom",
    desc: "For large organizations",
    seats: "Unlimited seats",
    best: false,
    features: [
      "Everything in Business",
      "Unlimited team members",
      "Dedicated success manager",
      "Custom AI training",
      "SSO & SAML",
      "Custom integrations",
      "SLA guarantee",
      "24/7 phone support",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<string>("free");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setUserId(data.id);
        setSubStatus(data.subscriptionStatus || "free");
      })
      .catch(() => {});
  }, []);

  async function handleSubscribe(slug: string) {
    if (!userId) {
      router.push("/signup");
      return;
    }
    if (slug === "enterprise") {
      window.location.assign("mailto:sales@britsyncai.com");
      return;
    }
    setLoading(slug);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: slug }),
      });
      const data = await res.json();
      if (data.url) window.location.assign(data.url);
    } catch (err) {
      console.error(err);
    }
    setLoading(null);
  }

  const isSubscribed = subStatus === "active" || subStatus === "trialing";

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="container mx-auto px-6 py-40 space-y-32">
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic">Simple Pricing.</h1>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto font-medium tracking-tight">Choose the plan that fits your team. Upgrade anytime.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((p) => (
            <div
              key={p.slug}
              className={`p-10 rounded-[40px] flex flex-col justify-between shadow-xl relative overflow-hidden ${
                p.best
                  ? "bg-[#012169] text-white shadow-[0_40px_100px_-20px_rgba(79,70,229,0.6)] scale-105"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              {p.best && (
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Sparkles className="w-32 h-32 rotate-12" />
                </div>
              )}
              <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className={`text-2xl font-black italic ${p.best ? "text-white" : ""}`}>{p.name}</h2>
                    <p className={`text-xs font-black uppercase tracking-widest mt-1 ${p.best ? "text-blue-200" : "text-zinc-500"}`}>{p.seats}</p>
                  </div>
                  {p.best && (
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">Best Value</span>
                  )}
                </div>
                <div className="flex items-end gap-1">
                  <span className={`text-5xl font-black ${p.best ? "text-white" : ""}`}>{p.price}</span>
                  {p.price !== "Custom" && (
                    <span className={`font-bold mb-2 text-sm ${p.best ? "text-blue-200" : "text-zinc-400"}`}>/mo</span>
                  )}
                </div>
                <p className={`text-sm font-medium ${p.best ? "text-blue-100" : "text-zinc-500"}`}>{p.desc}</p>
                <div className={`h-px ${p.best ? "bg-white/20" : "bg-white/10"}`} />
                <ul className="space-y-4">
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-center gap-3 text-[13px] font-bold ${p.best ? "text-white" : "text-zinc-300"}`}>
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${p.best ? "text-white" : "text-[#012169]"}`} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleSubscribe(p.slug)}
                disabled={loading !== null}
                className={`w-full mt-10 py-5 rounded-[20px] text-center font-black uppercase tracking-[0.2em] text-[10px] transition-all disabled:opacity-50 ${
                  p.best
                    ? "bg-white text-[#012169] hover:scale-95 shadow-2xl"
                    : "bg-[#012169] text-white hover:bg-[#012169]/90"
                }`}
              >
                {loading === p.slug ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : !userId ? (
                  "Start Free Trial"
                ) : isSubscribed ? (
                  "Already Subscribed"
                ) : p.slug === "enterprise" ? (
                  "Contact Sales"
                ) : (
                  "Subscribe"
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-zinc-500 text-sm font-medium max-w-md mx-auto">
            All plans include a 14-day free trial. Cancel anytime. 24/7 support.
          </p>
          <Link href="/landing#faq" className="inline-flex items-center gap-2 text-blue-300 font-black uppercase tracking-widest text-xs mt-8 group">
            Have questions? <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
