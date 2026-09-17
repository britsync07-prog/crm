import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchEmailBody } from "@/lib/imap";

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
    const indexParam = searchParams.get("index");
    const idParam = searchParams.get("id");
    const isInline = searchParams.get("inline") === "true";

    const activeImapAccount = await getUserEmailAccount(session.id, accountId);
    if (!activeImapAccount) {
      return NextResponse.json({ error: "No connected IMAP account found." }, { status: 404 });
    }

    const email = await fetchEmailBody(activeImapAccount, mailbox, uid);
    if (!email || !email.attachments || email.attachments.length === 0) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    let attachment: any = null;
    if (indexParam !== null && !isNaN(parseInt(indexParam, 10))) {
      attachment = email.attachments[parseInt(indexParam, 10)];
    }
    if (!attachment && idParam) {
      attachment = email.attachments.find((att: any) => att.id === idParam || att.contentId === idParam);
    }
    if (!attachment && email.attachments.length > 0) {
      attachment = email.attachments[0];
    }

    if (!attachment || !attachment.dataBase64) {
      return NextResponse.json({ error: "Attachment content unavailable" }, { status: 404 });
    }

    const buffer = Buffer.from(attachment.dataBase64, "base64");
    const filename = attachment.filename || "attachment";
    const dispositionType = isInline ? "inline" : "attachment";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": attachment.contentType || "application/octet-stream",
        "Content-Disposition": `${dispositionType}; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, max-age=86400",
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "frame-ancestors 'self'",
      },
    });
  } catch (error: any) {
    console.error("GET /api/emails/[uid]/attachment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
