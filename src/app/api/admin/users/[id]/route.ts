import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      bannedAt: true,
      bannedBy: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      organizationId: true,
      memberProfile: {
        select: {
          role: true,
          organization: {
            select: { id: true, name: true, plan: true, seatLimit: true, subscriptionStatus: true },
          },
        },
      },
      ownedOrganization: {
        select: { id: true, name: true, plan: true, seatLimit: true, subscriptionStatus: true },
      },
      employeeProfile: { select: { department: true, position: true, status: true } },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
