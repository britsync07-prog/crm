import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;

  const invite = await prisma.organizationMember.findUnique({
    where: { inviteToken: token },
  });

  if (!invite || invite.status !== "pending") {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || user.email !== invite.email) {
    return NextResponse.json({ error: "This invite was sent to a different email" }, { status: 403 });
  }

  await prisma.organizationMember.update({
    where: { id: invite.id },
    data: { status: "active", userId: session.id, lastActive: new Date() },
  });

  await prisma.user.update({
    where: { id: session.id },
    data: { organizationId: invite.organizationId },
  });

  return NextResponse.json({ success: true });
}
