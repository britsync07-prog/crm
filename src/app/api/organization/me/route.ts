import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.organizationMember.findFirst({
    where: { userId: session.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          plan: true,
          seatLimit: true,
          subscriptionStatus: true,
          subscriptionEndDate: true,
        },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ plan: "free", subscriptionStatus: "free", seatLimit: 1, role: null });
  }

  const activeCount = await prisma.organizationMember.count({
    where: { organizationId: member.organization.id, status: "active" },
  });

  return NextResponse.json({
    organizationId: member.organization.id,
    organizationName: member.organization.name,
    plan: member.organization.plan,
    subscriptionStatus: member.organization.subscriptionStatus,
    subscriptionEndDate: member.organization.subscriptionEndDate,
    seatLimit: member.organization.seatLimit,
    activeMembers: activeCount,
    myRole: member.role,
  });
}
