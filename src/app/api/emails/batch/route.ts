import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { performBatchEmailAction } from "@/lib/imap";

async function getUserEmailAccount(userId: string, accountId: string | null) {
  if (accountId) {
    return prisma.emailAccount.findFirst({
      where: { id: accountId, userId },
    });
  }

  return prisma.emailAccount.findFirst({
    where: { userId, imapHost: { not: null }, imapPort: { not: null }, isActive: true },
  });
}

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

    const activeImapAccount = await getUserEmailAccount(session.id, accountId || null);

    if (!activeImapAccount) {
      return NextResponse.json({ error: "No connected IMAP account found." }, { status: 404 });
    }

    const result = await performBatchEmailAction(activeImapAccount, mailbox || "INBOX", uids, action);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/emails/batch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
