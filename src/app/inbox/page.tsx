import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { fetchRecentEmails } from "@/lib/imap";
import { redirect } from "next/navigation";
import InboxClient from "@/components/inbox/InboxClient";

export const dynamic = 'force-dynamic';

export default async function UnifiedInboxPage() {
  const session = await getSession();

  if (!session) {
    redirect("/landing");
  }

  const userId = session.id;

  const emailAccounts = await prisma.emailAccount.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { id: "desc" }],
    select: { id: true, email: true, isActive: true, imapHost: true, imapPort: true }
  });

  let threads: any[] = [];
  let initialError: string | null = null;
  let activeImapAccount = emailAccounts.find(a => a.isActive && a.imapHost && a.imapPort);

  for (const account of emailAccounts.filter(a => a.isActive && a.imapHost && a.imapPort)) {
    const fullAccount = await prisma.emailAccount.findUnique({ where: { id: account.id } });
    if (!fullAccount) continue;

    try {
      threads = await fetchRecentEmails(fullAccount, "INBOX");
      activeImapAccount = account;
      initialError = null;
      break;
    } catch (error) {
      if (!initialError) {
        initialError = error instanceof Error ? error.message : "Failed to load mailbox.";
      }
    }
  }

  if (!activeImapAccount) {
    initialError = "No connected IMAP account found.";
  } else if (threads.length === 0 && !initialError) {
    const fullAccount = await prisma.emailAccount.findUnique({ where: { id: activeImapAccount.id } });
    if (fullAccount) {
      try {
        threads = await fetchRecentEmails(fullAccount, "INBOX");
      } catch (error) {
        initialError = error instanceof Error ? error.message : "Failed to load mailbox.";
      }
    }
  }

  return (
    <InboxClient
      initialEmails={threads}
      emailAccounts={emailAccounts}
      initialActiveAccountId={activeImapAccount?.id}
      initialError={initialError}
    />
  );
}
