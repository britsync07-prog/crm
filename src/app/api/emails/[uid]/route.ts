import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchEmailBody, performEmailAction } from "@/lib/imap";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string }> | { uid: string } }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Await params if it's a promise (Next.js 15+ behavior)
        let uid = '';
        if (params instanceof Promise) {
            uid = (await params).uid;
        } else {
            uid = params.uid;
        }

        const { searchParams } = new URL(req.url);
        const mailbox = searchParams.get("mailbox") || "INBOX";
        const accountId = searchParams.get("accountId");

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
    { params }: { params: Promise<{ uid: string }> | { uid: string } }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Await params if it's a promise (Next.js 15+ behavior)
        let uid = '';
        if (params instanceof Promise) {
            uid = (await params).uid;
        } else {
            uid = params.uid;
        }

        const body = await req.json();
        const { action, mailbox, accountId } = body;

        if (!["archive", "trash", "spam", "read", "unread"].includes(action)) {
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
