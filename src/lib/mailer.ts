import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { prisma } from "./db";
import { appendEmailToSentFolder } from "./imap";

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

  const transporter = nodemailer.createTransport({
    host: account.host,
    port: account.port,
    secure: account.encryption === "SSL", // true for 465, false for other ports
    auth: {
      user: account.username,
      pass: account.password,
    },
  });

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
