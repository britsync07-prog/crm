import { prisma } from "@/lib/db";
import { sendRealEmail } from "@/lib/mailer";
import { getAppBaseUrl } from "@/lib/app-url";

const activeCampaigns = new Set<string>();

export function normalizeEmail(input: string): string | null {
  const email = String(input || "").trim().toLowerCase();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function nameFromEmail(email: string): string {
  const prefix = email.split("@")[0] || "Lead";
  return prefix
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function injectOpenPixel(html: string, campaignLeadId: string): string {
  const base = getAppBaseUrl();
  const pixelUrl = `${base}/api/outreach/track/open?clid=${encodeURIComponent(campaignLeadId)}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;opacity:0;width:1px;height:1px;" />`;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${pixel}</body>`);
  return `${html}\n${pixel}`;
}

export function parseRecipients(raw: string): string[] {
  const tokens = raw
    .split(/[\n,;]+/)
    .map((r) => normalizeEmail(r))
    .filter((v): v is string => Boolean(v));

  return Array.from(new Set(tokens));
}

function isPermanentMailBounce(error: unknown): boolean {
  const msg = String(error instanceof Error ? error.message : error || "").toLowerCase();
  return (
    /\b55[0-4]\b/.test(msg) ||
    msg.includes("user unknown") ||
    msg.includes("recipient not found") ||
    msg.includes("mailbox not found") ||
    msg.includes("mailbox unavailable") ||
    msg.includes("invalid address") ||
    msg.includes("no such user") ||
    msg.includes("address rejected")
  );
}

export async function launchOutreachCampaign(input: {
  userId: string;
  campaignName: string;
  senderName?: string;
  subject: string;
  htmlContent: string;
  recipients: string[];
  smtpAccountIds: string[];
}) {
  const recipients = Array.from(new Set(input.recipients.map((r) => normalizeEmail(r)).filter((v): v is string => Boolean(v))));
  if (recipients.length === 0) {
    throw new Error("No valid recipients provided.");
  }

  // Find active accounts from the requested IDs or any active account for this user
  let accounts = await prisma.emailAccount.findMany({
    where: {
      id: input.smtpAccountIds.length > 0 ? { in: input.smtpAccountIds } : undefined,
      userId: input.userId,
      isActive: true,
    },
    select: { id: true, email: true },
  });

  if (accounts.length === 0) {
    accounts = await prisma.emailAccount.findMany({
      where: {
        userId: input.userId,
        isActive: true,
      },
      select: { id: true, email: true },
    });
  }

  const campaign = await prisma.$transaction(async (tx) => {
    const created = await tx.campaign.create({
      data: {
        userId: input.userId,
        name: input.campaignName,
        subject: input.subject,
        body: input.htmlContent,
        type: "EMAIL",
        status: "Active",
        emailAccountId: accounts[0]?.id || null,
      },
    });

    const leadIds: string[] = [];
    for (const email of recipients) {
      const existing = await tx.lead.findUnique({ where: { email } });
      if (existing && existing.userId !== input.userId) {
        continue;
      }
      const lead = existing
        ? existing
        : await tx.lead.create({
            data: {
              userId: input.userId,
              name: nameFromEmail(email),
              email,
              source: "Outreach Sender",
              status: "Contacted",
            },
          });
      leadIds.push(lead.id);
    }

    if (leadIds.length > 0) {
      await tx.campaignLead.createMany({
        data: leadIds.map((leadId) => ({
          campaignId: created.id,
          leadId,
          status: "Pending",
        })),
      });
    }

    return created;
  });

  // Always queue the campaign for background processing without throwing errors to the caller
  const activeIds = accounts.map((a) => a.id);
  queueCampaignWorker(campaign.id, input.userId, activeIds, input.senderName || "BritCRM Outreach");
  return campaign;
}

function queueCampaignWorker(campaignId: string, userId: string, smtpAccountIds: string[], senderName: string) {
  if (activeCampaigns.has(campaignId)) return;
  activeCampaigns.add(campaignId);

  setImmediate(async () => {
    try {
      await processCampaign(campaignId, userId, smtpAccountIds, senderName);
    } finally {
      activeCampaigns.delete(campaignId);
    }
  });
}

async function processCampaign(campaignId: string, userId: string, smtpAccountIds: string[], senderName: string) {
  let senderIndex = 0;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, subject: true, body: true },
    });
    if (!campaign) return;

    let accountIds = [...smtpAccountIds];
    if (accountIds.length === 0) {
      const fallbackAccounts = await prisma.emailAccount.findMany({
        where: { userId, isActive: true },
        select: { id: true },
      });
      accountIds = fallbackAccounts.map((a) => a.id);
    }

    // If still no sender accounts, keep leads queued as Pending for future delivery
    if (accountIds.length === 0) {
      console.warn(`[OutreachWorker] No active SMTP sender accounts found for campaign ${campaignId}. Mails remain safely queued.`);
      return;
    }

    const pending = await prisma.campaignLead.findMany({
      where: { campaignId, status: "Pending" },
      include: { lead: true },
      orderBy: { id: "asc" },
    });

    for (const recipient of pending) {
      const accountId = accountIds[senderIndex % accountIds.length];
      senderIndex += 1;

      try {
        await sendRealEmail({
          emailAccountId: accountId,
          to: recipient.lead.email,
          subject: campaign.subject,
          body: injectOpenPixel(campaign.body, recipient.id),
          senderName,
          variables: {
            FirstName: recipient.lead.name?.split(" ")[0] || "there",
            Company: recipient.lead.company || "your team",
            SenderName: senderName,
          },
          skipSentFolder: true,
        });

        await prisma.campaignLead.update({
          where: { id: recipient.id },
          data: { status: "Sent", sentAt: new Date() },
        });
      } catch (err: any) {
        if (isPermanentMailBounce(err)) {
          await prisma.campaignLead.update({
            where: { id: recipient.id },
            data: { status: "Bounced" },
          });
          console.warn(`[OutreachWorker] Permanent bounce for recipient ${recipient.lead.email}:`, err?.message || err);
        } else {
          // Mail server error, timeout, or rate/time limit: keep mail queued (Pending)
          console.warn(
            `[OutreachWorker] Mail server error or time limit for recipient ${recipient.lead.email}: ${err?.message || err}. Mail remains queued in campaign.`
          );
          // Recipient status remains "Pending" in the database queue
        }
      }
    }

    const remainingPending = await prisma.campaignLead.count({
      where: { campaignId, status: "Pending" },
    });

    await prisma.campaign.update({
      where: { id: campaignId, userId },
      data: { status: remainingPending > 0 ? "Active" : "Completed" },
    });
  } catch (err: any) {
    console.error(`[OutreachWorker] Campaign ${campaignId} queue worker encountered error:`, err?.message || err);
    await prisma.campaign.updateMany({
      where: { id: campaignId, userId },
      data: { status: "Active" },
    });
  }
}
