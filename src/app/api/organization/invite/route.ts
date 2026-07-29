import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const member = await prisma.organizationMember.findFirst({
    where: { userId: session.id },
    include: { organization: true },
  });

  if (!member || member.role !== "admin") {
    return NextResponse.json({ error: "Only admins can invite members" }, { status: 403 });
  }

  const org = member.organization;
  const activeCount = await prisma.organizationMember.count({
    where: { organizationId: org.id, status: "active" },
  });

  if (activeCount >= org.seatLimit) {
    return NextResponse.json({ error: "Seat limit reached. Upgrade your plan." }, { status: 400 });
  }

  const existing = await prisma.organizationMember.findUnique({
    where: { organizationId_email: { organizationId: org.id, email } },
  });

  if (existing) {
    return NextResponse.json({ error: "This email has already been invited or is a member" }, { status: 400 });
  }

  const invite = await prisma.organizationMember.create({
    data: {
      organizationId: org.id,
      email,
      role: "member",
      status: "pending",
      invitedById: session.id,
    },
    select: { inviteToken: true, email: true },
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/invite/org/${invite.inviteToken}`;

  return NextResponse.json({ inviteUrl, email: invite.email });
}
