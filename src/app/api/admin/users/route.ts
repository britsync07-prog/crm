import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = 20;

  const where = query
    ? {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        bannedAt: true,
        createdAt: true,
        organizationId: true,
        memberProfile: {
          select: { organization: { select: { name: true, plan: true } } },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  });
}
