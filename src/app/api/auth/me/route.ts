import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ id: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true },
  });

  const member = await prisma.organizationMember.findFirst({
    where: { userId: session.id },
    include: {
      organization: {
        select: {
          plan: true,
          subscriptionStatus: true,
          subscriptionEndDate: true,
          seatLimit: true,
        },
      },
    },
  });

  return NextResponse.json({
    ...user,
    subscriptionStatus: member?.organization?.subscriptionStatus ?? "free",
    subscriptionEndDate: member?.organization?.subscriptionEndDate ?? null,
    plan: member?.organization?.plan ?? "free",
    seatLimit: member?.organization?.seatLimit ?? 1,
  });
}
