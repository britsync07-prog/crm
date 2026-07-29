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
        include: {
          members: {
            include: {
              user: { select: { name: true, email: true, image: true } },
              invitedBy: { select: { name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ members: [], seatLimit: 1, plan: "free" });
  }

  const org = member.organization;
  return NextResponse.json({
    members: org.members.map((m) => ({
      id: m.id,
      email: m.email,
      role: m.role,
      status: m.status,
      inviteToken: m.inviteToken,
      name: m.user?.name ?? null,
      invitedByName: m.invitedBy?.name ?? null,
      joinedAt: m.createdAt,
      lastActive: m.lastActive,
    })),
    seatLimit: org.seatLimit,
    plan: org.plan,
    myRole: member.role,
  });
}
