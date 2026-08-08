import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchRecentEmails } from "@/lib/imap";
import { sendRealEmail } from "@/lib/mailer";

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

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const mailbox = searchParams.get("mailbox") || "INBOX";
        const accountId = searchParams.get("accountId");

        const activeImapAccount = await getUserEmailAccount(session.id, accountId);

        if (!activeImapAccount || !activeImapAccount.imapHost) {
            return NextResponse.json({ error: "No connected IMAP account found." }, { status: 404 });
        }

        const emails = await fetchRecentEmails(activeImapAccount, mailbox);
        return NextResponse.json({ emails });
    } catch (error: any) {
        console.error("GET /api/emails error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const body = await req.json();
        const { to, subject, body: emailBody, accountId } = body;

        if (!to || !subject || !emailBody) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const activeImapAccount = await getUserEmailAccount(session.id, accountId || null);

        if (!activeImapAccount) {
            return NextResponse.json({ error: "No connected email account found." }, { status: 404 });
        }

        await sendRealEmail({
            emailAccountId: activeImapAccount.id,
            to,
            subject,
            body: emailBody
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("POST /api/emails/send error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
