import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { performBatchEmailAction } from "@/lib/imap";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, mailbox, accountId, uids } = body;

    if (!action || !uids || !Array.isArray(uids) || uids.length === 0) {
      return NextResponse.json({ error: "Missing required fields: action, uids" }, { status: 400 });
    }

    if (!["archive", "trash", "spam", "read", "unread", "star", "unstar"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const emailAccounts = await prisma.emailAccount.findMany({
      where: { userId: session.id },
    });

    let activeImapAccount = emailAccounts.find(a => a.id === accountId);
    if (!activeImapAccount) {
      activeImapAccount = emailAccounts.find(a => a.imapHost && a.imapPort);
    }

    if (!activeImapAccount) {
      return NextResponse.json({ error: "No IMAP account" }, { status: 404 });
    }

    const result = await performBatchEmailAction(activeImapAccount, mailbox || "INBOX", uids, action);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/emails/batch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
