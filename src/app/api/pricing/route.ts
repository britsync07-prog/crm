import { NextResponse } from "next/server";
import { getPricingOffers, getPublicPricingPlans } from "@/lib/pricing";

export async function GET() {
  const [plans, offers] = await Promise.all([
    getPublicPricingPlans(),
    getPricingOffers({ activeOnly: true }),
  ]);

  const now = Date.now();
  const activeOffers = offers.filter((o) => {
    const starts = new Date(o.startsAt).getTime();
    const ends = new Date(o.endsAt).getTime();
    return o.isActive && starts <= now && ends >= now;
  });

  const featuredOffer = activeOffers[0] || null;

  return NextResponse.json({
    plans,
    offers: activeOffers,
    featuredOffer,
  });
}
