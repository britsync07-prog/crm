import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchRecentEmails, performEmailAction } from "@/lib/imap";
import { sendRealEmail } from "@/lib/mailer";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const mailbox = searchParams.get("mailbox") || "INBOX";
        const accountId = searchParams.get("accountId");

        const emailAccounts = await prisma.emailAccount.findMany({
            where: { userId: session.id },
        });

        // Try to find the requested account, or fallback to the first active account with IMAP configured
        let activeImapAccount = emailAccounts.find(a => a.id === accountId);
        if (!activeImapAccount) {
            activeImapAccount = emailAccounts.find(a => a.imapHost && a.imapPort);
        }

        if (!activeImapAccount || !activeImapAccount.imapHost) {
            return NextResponse.json({ emails: [] });
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

        const emailAccounts = await prisma.emailAccount.findMany({
            where: { userId: session.id },
        });

        let activeImapAccount = emailAccounts.find(a => a.id === accountId);
        if (!activeImapAccount) {
            activeImapAccount = emailAccounts.find(a => a.imapHost && a.imapPort);
        }

        if (!activeImapAccount) {
            return NextResponse.json({ error: "No email account configured" }, { status: 404 });
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
