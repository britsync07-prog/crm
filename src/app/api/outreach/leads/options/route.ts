import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [categories, statuses] = await Promise.all([
      prisma.category.findMany({
        where: { userId: session.id },
        include: { _count: { select: { leads: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.lead.groupBy({
        by: ["status"],
        where: { userId: session.id },
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        leadCount: c._count.leads,
      })),
      statuses: statuses
        .map((s) => ({
          status: s.status || "Unknown",
          count: s._count._all,
        }))
        .sort((a, b) => a.status.localeCompare(b.status)),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load lead options." }, { status: 500 });
  }
}
