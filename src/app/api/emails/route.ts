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
      orderBy: { id: "desc" },
    });
}

async function fetchFirstWorkingInbox(userId: string, mailbox: string) {
    const accounts = await prisma.emailAccount.findMany({
        where: { userId, imapHost: { not: null }, imapPort: { not: null }, isActive: true },
        orderBy: { id: "desc" },
    });
    let firstError: Error | null = null;

    for (const account of accounts) {
        try {
            return { emails: await fetchRecentEmails(account, mailbox), account };
        } catch (error: any) {
            if (!firstError) firstError = error instanceof Error ? error : new Error(String(error));
        }
    }

    if (firstError) throw firstError;
    return { emails: [], account: null };
}

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const mailbox = searchParams.get("mailbox") || "INBOX";
        const accountId = searchParams.get("accountId")?.trim() || null;

        if (!accountId) {
            const { emails, account } = await fetchFirstWorkingInbox(session.id, mailbox);
            if (!account) {
                return NextResponse.json({ error: "No connected IMAP account found." }, { status: 404 });
            }
            return NextResponse.json({ emails, accountId: account.id });
        }

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

        let to: string = "";
        let subject: string = "";
        let emailBody: string = "";
        let accountId: string | null = null;
        const attachments: Array<{ filename: string; content: Buffer; contentType?: string }> = [];

        const contentTypeHeader = req.headers.get("content-type") || "";
        if (contentTypeHeader.includes("multipart/form-data")) {
            const formData = await req.formData();
            to = (formData.get("to") as string)?.trim() || "";
            subject = (formData.get("subject") as string)?.trim() || "";
            emailBody = (formData.get("body") as string) || "";
            accountId = (formData.get("accountId") as string)?.trim() || null;

            const files = formData.getAll("attachments") as (File | string)[];
            for (const item of files) {
                if (item && typeof item === "object" && "arrayBuffer" in item && (item as File).size > 0) {
                    const file = item as File;
                    const arrayBuffer = await file.arrayBuffer();
                    attachments.push({
                        filename: file.name || "attachment",
                        content: Buffer.from(arrayBuffer),
                        contentType: file.type || "application/octet-stream"
                    });
                }
            }
        } else {
            const body = await req.json();
            to = (body.to || "").trim();
            subject = (body.subject || "").trim();
            emailBody = body.body || "";
            accountId = body.accountId?.trim() || null;

            if (Array.isArray(body.attachments)) {
                for (const att of body.attachments) {
                    if (att.content && att.filename) {
                        attachments.push({
                            filename: att.filename,
                            content: Buffer.from(att.content, att.encoding || 'base64'),
                            contentType: att.contentType || 'application/octet-stream'
                        });
                    }
                }
            }
        }

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
            body: emailBody,
            attachments: attachments.length > 0 ? attachments : undefined
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("POST /api/emails error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
