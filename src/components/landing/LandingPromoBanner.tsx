"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { PricingOffer } from "@/lib/pricing";

export default function LandingPromoBanner() {
  const [offer, setOffer] = useState<PricingOffer | null>(null);

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((data) => {
        if (data.featuredOffer) setOffer(data.featuredOffer);
      })
      .catch(() => {});
  }, []);

  if (!offer) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-red-600 via-[#012169] to-blue-900 text-white py-2 px-4 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-lg backdrop-blur-md">
      <Sparkles className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
      <span>
        Special Promotion: <strong className="underline">{offer.title}</strong> — Get{" "}
        <span className="bg-white text-red-600 px-2 py-0.5 rounded-full font-black text-[10px] ml-1">
          {offer.discountPercent}% OFF
        </span>
        {offer.couponCode ? ` with code "${offer.couponCode}"` : ""}!
      </span>
      <Link href="/pricing" className="ml-2 underline font-black text-amber-300 hover:text-white transition-colors">
        View Pricing &rarr;
      </Link>
    </div>
  );
}
