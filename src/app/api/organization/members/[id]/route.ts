import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const adminMembership = await prisma.organizationMember.findFirst({
    where: { userId: session.id, role: "admin" },
  });

  if (!adminMembership) {
    return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });
  }

  const target = await prisma.organizationMember.findFirst({
    where: { id, organizationId: adminMembership.organizationId },
  });

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.role === "admin") {
    return NextResponse.json({ error: "Cannot remove the admin" }, { status: 400 });
  }

  await prisma.organizationMember.delete({ where: { id } });

  if (target.userId) {
    await prisma.user.update({
      where: { id: target.userId },
      data: { organizationId: null },
    });
  }

  return NextResponse.json({ success: true });
}
