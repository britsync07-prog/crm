import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaigns = await prisma.campaign.findMany({
      where: { userId: session.id },
      include: {
        leads: {
          select: {
            status: true,
            sentAt: true,
            openedAt: true,
            repliedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const history = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      abortReason: null,
      deliveredCount: c.leads.filter((l) => l.status === "Sent").length,
      bouncedCount: c.leads.filter((l) => l.status === "Bounced").length,
      createdAt: c.createdAt,
      sentReportFile: null,
      failedReportFile: null,
    }));

    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch campaign history." }, { status: 500 });
  }
}
