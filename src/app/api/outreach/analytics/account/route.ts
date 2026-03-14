import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function percent(numerator: number, denominator: number) {
  if (!denominator) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const baseWhere = { campaign: { userId: session.id } };

    const [sent, delivered, bounced, opens, replies] = await Promise.all([
      prisma.campaignLead.count({ where: { ...baseWhere, sentAt: { not: null } } }),
      prisma.campaignLead.count({ where: { ...baseWhere, status: "Sent" } }),
      prisma.campaignLead.count({ where: { ...baseWhere, status: "Bounced" } }),
      prisma.campaignLead.count({ where: { ...baseWhere, openedAt: { not: null } } }),
      prisma.campaignLead.count({ where: { ...baseWhere, repliedAt: { not: null } } }),
    ]);

    return NextResponse.json({
      rawCounts: {
        sent,
        delivered,
        bounced,
        uniqueOpens: opens,
        uniqueClicks: 0,
        uniqueVisits: 0,
        replies,
      },
      metrics: {
        deliveryRate: percent(delivered, sent),
        bounceRate: percent(bounced, sent),
        openRate: percent(opens, delivered),
        clickThroughRate: "0.0%",
        clickToOpenRate: "0.0%",
        websiteVisitRate: "0.0%",
        replyRate: percent(replies, delivered),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to calculate account analytics." }, { status: 500 });
  }
}
