import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { prisma } from "./db";
import { appendEmailToSentFolder } from "./imap";

type SmtpAccount = {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption?: string | null;
};

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
    requireTLS: !secure && ["TLS", "STARTTLS"].includes((account.encryption || "").toUpperCase()),
    auth: {
      user: account.username,
      pass: account.password,
    },
  });
}

function formatSmtpError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/authentication|invalid login|auth|credentials|username|password/i.test(message)) {
    return "SMTP login failed. Check the mailbox username and password.";
  }
  if (/certificate|self signed|tls|starttls/i.test(message)) {
    return "SMTP TLS connection failed. Check the host, port, and security mode.";
  }
  if (/timeout|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(message)) {
    return "SMTP server could not be reached. Check the SMTP host and port.";
  }
  return `SMTP connection failed: ${message}`;
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
}) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: config.emailAccountId },
  });

  if (!account) throw new Error("Email account not found");

  if (account.sentToday >= account.dailyLimit) {
    throw new Error(`Daily send limit reached (${account.sentToday}/${account.dailyLimit}) for ${account.email}`);
  }

  const transporter = createSmtpTransport(account);

  // Replace variables
  let finalBody = config.body;
  if (config.variables) {
    Object.entries(config.variables).forEach(([key, value]) => {
      finalBody = finalBody.replace(new RegExp(`{{${key}}}`, "g"), value || "");
    });
  }

  const messageData = {
    from: `"${config.senderName || account.username}" <${account.email}>`,
    to: config.to,
    subject: config.subject,
    html: finalBody,
    text: finalBody.replace(/<[^>]*>?/gm, ''), // Simple HTML to Text fallback
  };

  const info = await transporter.sendMail(messageData);

  // Compile raw message and append to IMAP Sent folder
  try {
    const composer = new MailComposer(messageData);
    const rawMessage = await composer.compile().build();
    await appendEmailToSentFolder(account, rawMessage);
  } catch (err) {
    console.error("Failed to append sent message to IMAP Sent folder", err);
  }

  // Update daily stats
  await prisma.emailAccount.update({
    where: { id: account.id },
    data: { sentToday: { increment: 1 } },
  });

  return info;
}
