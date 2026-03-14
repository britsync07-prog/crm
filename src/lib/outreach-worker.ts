import { prisma } from "@/lib/db";
import { sendRealEmail } from "@/lib/mailer";
import { getAppBaseUrl } from "@/lib/app-url";

const SEND_DELAY_MS = 5000;
const MAX_CONSECUTIVE_FAILURES = 3;
const SMTP_REST_MS = 60 * 60 * 1000;
const activeCampaigns = new Set<string>();
const smtpHealth = new Map<string, { consecutiveFails: number; restUntil: number | null }>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeEmail(input: string): string | null {
  const email = String(input || "").trim().toLowerCase();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function nameFromEmail(email: string): string {
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

function getSmtpState(accountId: string) {
  const state = smtpHealth.get(accountId);
  if (state) return state;
  const initial = { consecutiveFails: 0, restUntil: null as number | null };
  smtpHealth.set(accountId, initial);
  return initial;
}

function canUseSmtpAccount(accountId: string, nowTs = Date.now()) {
  const state = getSmtpState(accountId);
  return !state.restUntil || state.restUntil <= nowTs;
}

function markSmtpSuccess(accountId: string) {
  const state = getSmtpState(accountId);
  state.consecutiveFails = 0;
  state.restUntil = null;
}

function markSmtpFailure(accountId: string): number | null {
  const state = getSmtpState(accountId);
  state.consecutiveFails += 1;
  if (state.consecutiveFails >= MAX_CONSECUTIVE_FAILURES) {
    state.restUntil = Date.now() + SMTP_REST_MS;
    state.consecutiveFails = MAX_CONSECUTIVE_FAILURES;
    return state.restUntil;
  }
  return null;
}

function getEarliestRestWakeup(accountIds: string[]) {
  let earliest: number | null = null;
  for (const accountId of accountIds) {
    const state = getSmtpState(accountId);
    if (!state.restUntil) continue;
    if (earliest === null || state.restUntil < earliest) earliest = state.restUntil;
  }
  return earliest;
}

function pickAvailableSmtpAccount(accountIds: string[], currentIndex: number) {
  if (accountIds.length === 0) return { accountId: null as string | null, nextIndex: currentIndex };
  const nowTs = Date.now();
  for (let offset = 0; offset < accountIds.length; offset += 1) {
    const idx = (currentIndex + offset) % accountIds.length;
    const accountId = accountIds[idx];
    if (canUseSmtpAccount(accountId, nowTs)) {
      return { accountId, nextIndex: (idx + 1) % accountIds.length };
    }
  }
  return { accountId: null as string | null, nextIndex: currentIndex };
}

export function parseRecipients(raw: string): string[] {
  const tokens = raw
    .split(/[\n,;]+/)
    .map((r) => normalizeEmail(r))
    .filter((v): v is string => Boolean(v));

  return Array.from(new Set(tokens));
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
  if (input.smtpAccountIds.length === 0) {
    throw new Error("Please select at least one SMTP sender account.");
  }

  const accounts = await prisma.emailAccount.findMany({
    where: {
      id: { in: input.smtpAccountIds },
      userId: input.userId,
      isActive: true,
    },
    select: { id: true, email: true },
  });
  if (accounts.length === 0) {
    throw new Error("No active SMTP sender accounts found.");
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
        emailAccountId: accounts[0].id,
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

  queueCampaignWorker(campaign.id, input.userId, accounts.map((a) => a.id), input.senderName || "BritCRM Outreach");
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

    const pending = await prisma.campaignLead.findMany({
      where: { campaignId, status: "Pending" },
      include: { lead: true },
      orderBy: { id: "asc" },
    });

    for (const recipient of pending) {
      const selection = pickAvailableSmtpAccount(smtpAccountIds, senderIndex);
      if (!selection.accountId) {
        const wakeupAt = getEarliestRestWakeup(smtpAccountIds);
        const waitMs = wakeupAt ? Math.max(5000, wakeupAt - Date.now()) : SMTP_REST_MS;
        const wakeupIso = new Date(Date.now() + waitMs).toISOString();
        console.warn(
          `[OutreachWorker] All selected SMTP accounts are resting. Campaign ${campaignId} waiting until ${wakeupIso}`
        );
        await sleep(waitMs);
        continue;
      }
      const accountId = selection.accountId;
      senderIndex = selection.nextIndex;

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
        });
        markSmtpSuccess(accountId);

        await prisma.campaignLead.update({
          where: { id: recipient.id },
          data: { status: "Sent", sentAt: new Date() },
        });
      } catch (err: any) {
        const restUntil = markSmtpFailure(accountId);
        if (restUntil) {
          console.warn(
            `[OutreachWorker] SMTP ${accountId} reached ${MAX_CONSECUTIVE_FAILURES} consecutive failures. Resting until ${new Date(restUntil).toISOString()}`
          );
        }
        await prisma.campaignLead.update({
          where: { id: recipient.id },
          data: { status: "Bounced" },
        });
        console.error(`[OutreachWorker] Failed recipient ${recipient.lead.email}:`, err?.message || err);
      }

      await sleep(SEND_DELAY_MS);
    }

    await prisma.campaign.update({
      where: { id: campaignId, userId },
      data: { status: "Completed" },
    });
  } catch (err: any) {
    console.error(`[OutreachWorker] Campaign ${campaignId} failed:`, err?.message || err);
    await prisma.campaign.updateMany({
      where: { id: campaignId, userId },
      data: { status: "Completed" },
    });
  }
}
