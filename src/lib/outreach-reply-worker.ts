import { prisma } from "@/lib/db";
import { fetchRecentInboxReplyCandidates } from "@/lib/imap";

function normalizeSubject(subject: string) {
  return (subject || "")
    .toLowerCase()
    .replace(/^(re|fw|fwd)\s*:\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function runOutreachReplySync() {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const accounts = await prisma.emailAccount.findMany({
    where: {
      isActive: true,
      imapHost: { not: null },
      imapPort: { not: null },
    },
    select: {
      id: true,
      userId: true,
      email: true,
      imapHost: true,
      imapPort: true,
      encryption: true,
      username: true,
      password: true,
    },
  });

  let scanned = 0;
  let matched = 0;

  for (const account of accounts) {
    const replies = await fetchRecentInboxReplyCandidates(account, since);
    scanned += replies.length;

    for (const reply of replies) {
      const normalizedReplySubject = normalizeSubject(reply.subject);
      if (!reply.fromEmail || !normalizedReplySubject) continue;

      const lead = await prisma.lead.findUnique({
        where: { email: reply.fromEmail },
        select: { id: true, userId: true, name: true },
      });
      if (!lead || lead.userId !== account.userId) continue;

      const candidates = await prisma.campaignLead.findMany({
        where: {
          leadId: lead.id,
          sentAt: { not: null },
          repliedAt: null,
          campaign: { userId: account.userId },
        },
        select: {
          id: true,
          sentAt: true,
          campaign: { select: { id: true, name: true, subject: true } },
        },
        orderBy: { sentAt: "desc" },
        take: 20,
      });

      const matchedCampaignLead = candidates.find((item) => {
        const normalizedCampaignSubject = normalizeSubject(item.campaign.subject || "");
        if (!normalizedCampaignSubject) return false;
        return (
          normalizedReplySubject.includes(normalizedCampaignSubject) ||
          normalizedCampaignSubject.includes(normalizedReplySubject)
        );
      });

      if (!matchedCampaignLead) continue;

      await prisma.campaignLead.update({
        where: { id: matchedCampaignLead.id },
        data: {
          repliedAt: reply.date,
        },
      });

      await prisma.interaction.create({
        data: {
          leadId: lead.id,
          type: "Email Reply",
          content: `Reply detected for campaign "${matchedCampaignLead.campaign.name}" from ${reply.fromEmail}. Subject: ${reply.subject}`,
        },
      });

      matched += 1;
    }
  }

  return { scanned, matched, accounts: accounts.length, since: since.toISOString() };
}
