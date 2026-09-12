import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserSubscription } from "@/lib/subscription";

export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ id: null });
  }

  const [user, sub] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, email: true, role: true, organizationId: true },
    }),
    getUserSubscription(session.id),
  ]);

  if (!user) {
    return NextResponse.json({ id: null });
  }

  return NextResponse.json({
    ...user,
    subscriptionStatus: sub.subscriptionStatus,
    subscriptionEndDate: sub.subscriptionEndDate?.toISOString() ?? null,
    plan: sub.plan,
    isExpired: sub.isExpired,
    isTrial: sub.isTrial,
    isActive: sub.isActive,
    isAdmin: sub.isAdmin,
    daysRemaining: sub.daysRemaining,
    organizationId: sub.organizationId,
    organizationName: sub.organizationName,
  });
}
