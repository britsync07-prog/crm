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
    select: { id: true, email: true, isActive: true, imapHost: true, imapPort: true }
  });

  // Fetch real emails from the first account configured with IMAP
  let threads: any[] = [];
  const activeImapAccount = emailAccounts.find(a => a.imapHost && a.imapPort);

  if (activeImapAccount) {
    // Pass the full account dynamically later, but for SSR we just take the first active one
    const fullAccount = await prisma.emailAccount.findUnique({ where: { id: activeImapAccount.id } });
    if (fullAccount) {
      threads = await fetchRecentEmails(fullAccount, "INBOX");
    }
  }

  // Fallback if no real emails were found or no IMAP account is configured
  if (threads.length === 0) {
    threads = [
      {
        id: "system-1",
 from: "BritCRM System",
        subject: "No Emails Found or Account Not Configured",
        snippet: "To view your real inbox here, navigate to Settings > Email and connect an account with IMAP credentials.",
        date: new Date().toLocaleDateString(),
        sentiment: "Neutral",
        aiSummary: "System Notification: IMAP setup required.",
        isRead: false,
        mailbox: "INBOX"
      }
    ];
  }

  return <InboxClient initialEmails={threads} emailAccounts={emailAccounts} />;
}
