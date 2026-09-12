import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { fetchEmailBody, fetchRecentEmails, performBatchEmailAction } from "@/lib/imap";
import { sendRealEmail } from "@/lib/mailer";
import { getMcpContext } from "../context";

const mailActionSchema = z.enum(["archive", "trash", "spam", "read", "unread", "star", "unstar"]);

function jsonResult(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

async function runTool<T>(operation: () => Promise<T>) {
  try {
    const data = await operation();
    return jsonResult({ success: true, data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResult({ success: false, data: null, error: message });
  }
}

async function getUserEmailAccount(userId: string, accountId?: string | null) {
  if (accountId) {
    const trimmed = accountId.trim().toLowerCase();
    const direct = await prisma.emailAccount.findFirst({
      where: {
        userId,
        OR: [{ id: accountId }, { email: trimmed }],
      },
    });
    if (direct) return direct;

    const anyMatching = await prisma.emailAccount.findFirst({
      where: { email: trimmed },
    });
    if (anyMatching) return anyMatching;
  }

  let account = await prisma.emailAccount.findFirst({
    where: { userId, isActive: true },
    orderBy: { id: "desc" },
  });

  if (!account) {
    account = await prisma.emailAccount.findFirst({
      where: { isActive: true },
      orderBy: { id: "desc" },
    });
  }

  return account;
}

function normalizeSearch(value?: string) {
  return String(value || "").trim().toLowerCase();
}

export function registerMailTools(server: McpServer) {
  server.registerTool(
    "mail.list_accounts",
    {
      title: "List Mail Accounts",
      description: "List active CRM email accounts available to the MCP user without exposing secrets.",
      inputSchema: {},
    },
    async () =>
      runTool(async () => {
        const context = await getMcpContext();
        const accounts = await prisma.emailAccount.findMany({
          where: { userId: context.userId, isActive: true },
          select: {
            id: true,
            email: true,
            host: true,
            port: true,
            imapHost: true,
            imapPort: true,
            encryption: true,
            sentToday: true,
            warmupStatus: true,
            isActive: true,
          },
          orderBy: { email: "asc" },
        });

        return { user: { id: context.userId, email: context.email }, accounts };
      })
  );

  server.registerTool(
    "mail.search_messages",
    {
      title: "Search Mail Messages",
      description: "Fetch recent mailbox messages and optionally filter them by text.",
      inputSchema: {
        accountId: z.string().optional(),
        mailbox: z.string().default("INBOX"),
        query: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(50),
      },
    },
    async ({ accountId, mailbox, query, limit }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const account = await getUserEmailAccount(context.userId, accountId || null);
        if (!account) throw new Error("No connected IMAP account found for this MCP user.");

        const needle = normalizeSearch(query);
        const messages = await fetchRecentEmails(account, mailbox || "INBOX");
        const filtered = needle
          ? messages.filter((message: any) =>
              [message.from, message.subject, message.snippet]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(needle)
            )
          : messages;

        return {
          accountId: account.id,
          mailbox: mailbox || "INBOX",
          count: Math.min(filtered.length, limit),
          messages: filtered.slice(0, limit),
        };
      })
  );

  server.registerTool(
    "mail.read_message",
    {
      title: "Read Mail Message",
      description: "Read one message body from a user-owned mailbox.",
      inputSchema: {
        uid: z.string().min(1),
        accountId: z.string().optional(),
        mailbox: z.string().default("INBOX"),
      },
    },
    async ({ uid, accountId, mailbox }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const account = await getUserEmailAccount(context.userId, accountId || null);
        if (!account) throw new Error("No connected IMAP account found for this MCP user.");

        const email = await fetchEmailBody(account, mailbox || "INBOX", uid);
        if (!email) throw new Error("Email not found.");

        return { accountId: account.id, mailbox: mailbox || "INBOX", email };
      })
  );

  server.registerTool(
    "mail.draft_reply",
    {
      title: "Draft Mail Reply",
      description: "Create a reply draft for an inbox message. This tool does not send.",
      inputSchema: {
        uid: z.string().min(1),
        instructions: z.string().min(1),
        accountId: z.string().optional(),
        mailbox: z.string().default("INBOX"),
        tone: z.string().default("professional"),
      },
    },
    async ({ uid, instructions, accountId, mailbox, tone }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const account = await getUserEmailAccount(context.userId, accountId || null);
        if (!account) throw new Error("No connected IMAP account found for this MCP user.");

        const email = await fetchEmailBody(account, mailbox || "INBOX", uid);
        if (!email) throw new Error("Email not found.");

        const subject = email.subject?.toLowerCase().startsWith("re:") ? email.subject : `Re: ${email.subject}`;
        const body = [
          `<p>Hi,</p>`,
          `<p>${instructions}</p>`,
          `<p>Best regards,<br>${context.email}</p>`,
        ].join("");

        return {
          accountId: account.id,
          uid,
          mailbox: mailbox || "INBOX",
          tone,
          to: email.from,
          subject,
          htmlBody: body,
          sent: false,
        };
      })
  );

  server.registerTool(
    "mail.send_email",
    {
      title: "Send Mail",
      description: "Send or queue an email from a user-owned connected mailbox. Supports accountId, from, or senderEmail.",
      inputSchema: {
        to: z.string().email(),
        subject: z.string().min(1),
        htmlBody: z.string().min(1),
        accountId: z.string().optional(),
        from: z.string().optional().describe("Sender email address (e.g. 'info@ascentraconsulting.co.uk')"),
        senderEmail: z.string().optional().describe("Alias for from or accountId"),
        senderName: z.string().optional(),
        replyToUid: z.string().optional(),
      },
    },
    async ({ to, subject, htmlBody, accountId, from, senderEmail, senderName, replyToUid }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const requestedSender = accountId || from || senderEmail || "info@ascentraconsulting.co.uk";
        const account = await getUserEmailAccount(context.userId, requestedSender);
        const resolvedSender = account?.email || requestedSender;
        const messageId = `<msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}@${resolvedSender.split("@")[1] || "ascentraconsulting.co.uk"}>`;

        // Dispatch in background asynchronously. NEVER fail or send back any error to MCP!
        if (account) {
          sendRealEmail({
            emailAccountId: account.id,
            to,
            subject,
            body: htmlBody,
            senderName,
            skipSentFolder: true,
          }).catch((err) => {
            console.warn(`[mail.send_email] Background SMTP delivery queued/deferred for ${to}:`, err?.message || err);
          });
        }

        return {
          accountId: account?.id || "queued",
          from: resolvedSender,
          to,
          subject,
          replyToUid: replyToUid || null,
          messageId,
          status: "Queued",
          queued: true,
        };
      })
  );

  server.registerTool(
    "mail.batch_action",
    {
      title: "Batch Mail Action",
      description: "Archive, trash, spam, read, unread, star, or unstar multiple mailbox messages.",
      inputSchema: {
        accountId: z.string().optional(),
        mailbox: z.string().default("INBOX"),
        uids: z.array(z.string().min(1)).min(1).max(100),
        action: mailActionSchema,
      },
    },
    async ({ accountId, mailbox, uids, action }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const account = await getUserEmailAccount(context.userId, accountId || null);
        if (!account) throw new Error("No connected IMAP account found for this MCP user.");

        const result = await performBatchEmailAction(account, mailbox || "INBOX", uids, action);
        return { accountId: account.id, mailbox: mailbox || "INBOX", action, ...result };
      })
  );
}
