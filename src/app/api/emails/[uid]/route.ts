import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchEmailBody, performEmailAction } from "@/lib/imap";

async function getUserEmailAccount(userId: string, accountId: string | null) {
    if (accountId) {
        return prisma.emailAccount.findFirst({
            where: { id: accountId, userId },
        });
    }

    return prisma.emailAccount.findFirst({
      where: { userId, imapHost: { not: null }, imapPort: { not: null }, isActive: true },
      orderBy: { id: "desc" },
    });
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { uid } = await params;

        const { searchParams } = new URL(req.url);
        const mailbox = searchParams.get("mailbox") || "INBOX";
        const accountId = searchParams.get("accountId")?.trim() || null;

        const activeImapAccount = await getUserEmailAccount(session.id, accountId);

        if (!activeImapAccount) {
            return NextResponse.json({ error: "No connected IMAP account found." }, { status: 404 });
        }

        const email = await fetchEmailBody(activeImapAccount, mailbox, uid);
        if (!email) {
            return NextResponse.json({ error: "Email not found" }, { status: 404 });
        }

        return NextResponse.json({ email });
    } catch (error: any) {
        console.error("GET /api/emails/[uid] error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { uid } = await params;

        const body = await req.json();
        const { action, mailbox, accountId } = body;

        if (!["archive", "trash", "spam", "read", "unread", "star", "unstar"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const activeImapAccount = await getUserEmailAccount(session.id, accountId || null);

        if (!activeImapAccount) {
            return NextResponse.json({ error: "No connected IMAP account found." }, { status: 404 });
        }

        const success = await performEmailAction(activeImapAccount, mailbox || "INBOX", uid, action);
        if (!success) {
            return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("PATCH /api/emails/[uid] error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
