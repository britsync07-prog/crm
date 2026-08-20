import { NextResponse } from "next/server";
import { getPublicPricingPlans } from "@/lib/pricing";

export async function GET() {
  const plans = await getPublicPricingPlans();
  return NextResponse.json({ plans });
}
