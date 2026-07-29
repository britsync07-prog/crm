import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.organizationMember.findUnique({
    where: { inviteToken: token },
    include: { organization: { select: { name: true, plan: true } } },
  });

  if (!invite || invite.status !== "pending") {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  return NextResponse.json({
    email: invite.email,
    organizationName: invite.organization.name,
    plan: invite.organization.plan,
    status: invite.status,
  });
}
