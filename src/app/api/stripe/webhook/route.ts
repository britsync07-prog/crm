import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

const PLAN_SEATS: Record<string, number> = {
  personal: 2,
  business: 5,
};

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object;
        const orgId = checkoutSession.client_reference_id;
        const subscriptionId = checkoutSession.subscription;
        const customerId = checkoutSession.customer;
        const plan = (checkoutSession.metadata?.plan as string) || "business";
        const seats = PLAN_SEATS[plan] || 5;

        if (orgId && subscriptionId && customerId) {
          await prisma.organization.update({
            where: { id: orgId },
            data: {
              stripeCustomerId: customerId as string,
              stripeSubscriptionId: subscriptionId as string,
              subscriptionStatus: "active",
              plan,
              seatLimit: seats,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const subId = subscription.id;
        const status = subscription.status;
        const endDate = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null;

        const statusMap: Record<string, string> = {
          active: "active",
          past_due: "past_due",
          canceled: "canceled",
          unpaid: "past_due",
          trialing: "trialing",
          incomplete: "past_due",
          incomplete_expired: "canceled",
          paused: "canceled",
        };

        await prisma.organization.updateMany({
          where: { stripeSubscriptionId: subId },
          data: {
            subscriptionStatus: statusMap[status] || "free",
            subscriptionEndDate: endDate,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as any;
        await prisma.organization.updateMany({
          where: { stripeSubscriptionId: deletedSub.id },
          data: {
            subscriptionStatus: "canceled",
            subscriptionEndDate: deletedSub.current_period_end
              ? new Date(deletedSub.current_period_end * 1000)
              : null,
          },
        });
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
