import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { prisma } from "./db";
import { appendEmailToSentFolder } from "./imap";
import { shouldResetSentToday } from "./email-account";

type SmtpAccount = {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption?: string | null;
};

const SMTP_TIMEOUT_MS = 45_000;
const SENT_FOLDER_APPEND_TIMEOUT_MS = 10_000;

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function isSmtpDirectTls(encryption: string | null | undefined, port: number) {
  const mode = (encryption || "").toUpperCase();
  return port === 465 || mode === "SSL" || mode === "SSL/TLS";
}

function createSmtpTransport(account: SmtpAccount) {
  const secure = isSmtpDirectTls(account.encryption, account.port);
  return nodemailer.createTransport({
    host: account.host,
    port: account.port,
    secure,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    requireTLS: !secure && ["TLS", "STARTTLS"].includes((account.encryption || "").toUpperCase()),
    auth: {
      user: account.username,
      pass: account.password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function formatSmtpError(error: unknown) {
  const errObj = error as any;
  const message = errObj instanceof Error ? errObj.message : String(errObj);
  const response = errObj?.response ? ` Server response: ${errObj.response}` : "";
  const code = errObj?.responseCode ? ` [Code ${errObj.responseCode}]` : "";

  if (/authentication|invalid login|auth|credentials|username|password/i.test(message)) {
    return `SMTP login failed: ${message}${response}${code}`;
  }
  if (/certificate|self signed|tls|starttls/i.test(message)) {
    return `SMTP TLS connection failed: ${message}${response}${code}`;
  }
  if (/timeout|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(message)) {
    return `SMTP server could not be reached: ${message}${response}${code}`;
  }
  return `SMTP connection failed: ${message}${response}${code}`;
}

export async function verifySmtpConnection(account: SmtpAccount) {
  try {
    await createSmtpTransport(account).verify();
  } catch (error) {
    throw new Error(formatSmtpError(error));
  }
}

/**
 * Real SMTP Email Sender
 */
export async function sendRealEmail(config: {
  emailAccountId: string;
  to: string;
  subject: string;
  body: string;
  senderName?: string;
  variables?: Record<string, string>;
  skipSentFolder?: boolean;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
    encoding?: string;
    cid?: string;
  }>;
}) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: config.emailAccountId },
  });

  if (!account) throw new Error("Email account not found");

  const transporter = createSmtpTransport(account);

  // Replace variables
  let finalBody = config.body;
  if (config.variables) {
    Object.entries(config.variables).forEach(([key, value]) => {
      finalBody = finalBody.replace(new RegExp(`{{${key}}}`, "g"), value || "");
    });
  }

  const messageData: any = {
    from: `"${config.senderName || account.username}" <${account.email}>`,
    to: config.to,
    subject: config.subject,
    html: finalBody,
    text: finalBody.replace(/<[^>]*>?/gm, ''), // Simple HTML to Text fallback
  };

  if (config.attachments && config.attachments.length > 0) {
    messageData.attachments = config.attachments;
  }

  let info: any;
  try {
    info = await withTimeout(transporter.sendMail(messageData), SMTP_TIMEOUT_MS, "SMTP send");
  } catch (err) {
    throw new Error(formatSmtpError(err));
  } finally {
    transporter.close();
  }

  // Compile raw message and append to IMAP Sent folder
  if (!config.skipSentFolder) {
    try {
      const composer = new MailComposer(messageData);
      const rawMessage = await composer.compile().build();
      await withTimeout(appendEmailToSentFolder(account, rawMessage), SENT_FOLDER_APPEND_TIMEOUT_MS, "IMAP Sent append");
    } catch (err) {
      console.error("Failed to append sent message to IMAP Sent folder", err);
    }
  }

  // Track send volume with automatic 24-hour daily reset
  const now = new Date();
  const needsReset = shouldResetSentToday(account.lastResetAt);
  await prisma.emailAccount.update({
    where: { id: account.id },
    data: {
      sentToday: needsReset ? 1 : { increment: 1 },
      lastResetAt: needsReset ? now : (account.lastResetAt || now),
    },
  });

  return info;
}
