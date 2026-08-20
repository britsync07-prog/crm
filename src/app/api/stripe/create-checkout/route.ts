import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCheckoutPlanConfig } from "@/lib/pricing";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let member = await prisma.organizationMember.findFirst({
    where: { userId: session.id, role: "admin" },
    include: { organization: true },
  });

  if (!member) {
    let orgId = user.organizationId;
    let org;

    if (!orgId) {
      org = await prisma.organization.create({
        data: {
          name: `${user.name || "My"}'s Organization`,
          ownerId: user.id,
          plan: "free",
          seatLimit: 1,
        },
      });
      orgId = org.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: orgId },
      });
    } else {
      org = await prisma.organization.findUnique({ where: { id: orgId } });
    }

    member = await prisma.organizationMember.create({
      data: {
        organizationId: orgId!,
        userId: user.id,
        email: user.email,
        role: "admin",
        status: "active",
        invitedById: user.id,
        lastActive: new Date(),
      },
      include: { organization: true },
    });
  }

  const { plan = "business" } = await req.json().catch(() => ({ plan: "business" }));
  const config = await getCheckoutPlanConfig(plan as string);
  if (!config) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const org = member.organization;

  try {
    const discounts = config.activeOffer
      ? [{
          coupon: (await stripe.coupons.create({
            percent_off: config.activeOffer.discountPercent,
            duration: "repeating",
            duration_in_months: 1,
            name: config.activeOffer.title,
          })).id,
        }]
      : undefined;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          ...(config.stripePriceId
            ? { price: config.stripePriceId }
            : {
                price_data: {
                  currency: "usd",
                  product_data: { name: config.name, description: `${config.seats} seats - ${config.name} Plan` },
                  unit_amount: config.amount,
                  recurring: { interval: "month" },
                },
              }),
          quantity: 1,
        },
      ],
      discounts,
      customer_email: org.stripeCustomerId
        ? undefined
        : (user.email ?? undefined),
      client_reference_id: org.id,
      success_url: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/settings/billing?canceled=true`,
      subscription_data: {
        trial_period_days: config.trialDays > 0 ? config.trialDays : undefined,
        metadata: {
          organizationId: org.id,
          plan,
          seats: config.seats,
          offerId: config.activeOffer?.id || "",
          discountPercent: config.activeOffer?.discountPercent || "",
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
