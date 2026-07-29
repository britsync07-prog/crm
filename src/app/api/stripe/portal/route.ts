import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.organizationMember.findFirst({
    where: { userId: session.id, role: "admin" },
    include: { organization: true },
  });

  if (!member?.organization.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 400 });
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: member.organization.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/settings/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
