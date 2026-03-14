import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { launchOutreachCampaign, parseRecipients } from "@/lib/outreach-worker";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const campaignName = String(body?.campaignName || "").trim();
    const senderName = String(body?.senderName || "").trim() || "BritCRM Outreach";
    const subject = String(body?.subject || "").trim();
    const htmlContent = String(body?.htmlContent || "").trim();
    const recipientsInput = String(body?.recipients || "");
    const includeManualRecipients = body?.includeManualRecipients !== false;
    const smtpAccountIds = Array.isArray(body?.smtpAccountIds)
      ? body.smtpAccountIds.map((v: unknown) => String(v))
      : [];
    const leadFilters = body?.leadFilters && typeof body.leadFilters === "object"
      ? body.leadFilters
      : null;

    if (!campaignName || !subject || !htmlContent) {
      return NextResponse.json({ error: "campaignName, subject and htmlContent are required." }, { status: 400 });
    }

    const manualRecipients = includeManualRecipients ? parseRecipients(recipientsInput) : [];
    let leadRecipients: string[] = [];

    if (leadFilters?.enabled) {
      const categoryIds = Array.isArray(leadFilters?.categoryIds)
        ? leadFilters.categoryIds.map((v: unknown) => String(v))
        : [];
      const excludeStatuses = Array.isArray(leadFilters?.excludeStatuses)
        ? leadFilters.excludeStatuses.map((v: unknown) => String(v))
        : [];
      const includeStatuses = Array.isArray(leadFilters?.includeStatuses)
        ? leadFilters.includeStatuses.map((v: unknown) => String(v))
        : [];

      const where: Prisma.LeadWhereInput = {
        userId: session.id,
      };
      if (categoryIds.length > 0) where.categoryId = { in: categoryIds };
      if (includeStatuses.length > 0) where.status = { in: includeStatuses };
      if (excludeStatuses.length > 0) {
        where.status = {
          ...(where.status as Prisma.StringFilter | undefined),
          notIn: excludeStatuses,
        };
      }

      const leads = await prisma.lead.findMany({
        where,
        select: { email: true },
      });
      leadRecipients = parseRecipients(leads.map((l) => l.email).join("\n"));
    }

    const recipients = Array.from(new Set([...manualRecipients, ...leadRecipients]));
    if (recipients.length === 0) {
      return NextResponse.json({ error: "At least one valid recipient email is required (manual or lead filters)." }, { status: 400 });
    }

    const campaign = await launchOutreachCampaign({
      userId: session.id,
      campaignName,
      senderName,
      subject,
      htmlContent,
      recipients,
      smtpAccountIds,
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      totalRecipients: recipients.length,
      sourceBreakdown: {
        manual: manualRecipients.length,
        leads: leadRecipients.length,
      },
      message: "Campaign accepted and queued for delivery.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to launch campaign." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaigns = await prisma.campaign.findMany({
      where: { userId: session.id },
      include: {
        leads: {
          select: {
            id: true,
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

    const history = campaigns.map((c) => {
      const sent = c.leads.filter((l) => l.sentAt).length;
      const delivered = c.leads.filter((l) => l.status === "Sent").length;
      const bounced = c.leads.filter((l) => l.status === "Bounced").length;
      const opens = c.leads.filter((l) => l.openedAt).length;
      const replies = c.leads.filter((l) => l.repliedAt).length;
      const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
      const openRate = delivered > 0 ? (opens / delivered) * 100 : 0;
      const replyRate = delivered > 0 ? (replies / delivered) * 100 : 0;

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        createdAt: c.createdAt,
        counts: { sent, delivered, bounced, opens, replies },
        metrics: {
          deliveryRate: Number(deliveryRate.toFixed(1)),
          openRate: Number(openRate.toFixed(1)),
          replyRate: Number(replyRate.toFixed(1)),
        },
      };
    });

    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch campaign history." }, { status: 500 });
  }
}
