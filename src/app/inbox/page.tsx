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

  return <InboxClient initialEmails={threads} emailAccounts={emailAccounts} />;
}
