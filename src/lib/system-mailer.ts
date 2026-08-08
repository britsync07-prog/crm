import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

type MailProfile = "transactional" | "newsletter";
type ProfileConfig = {
  host?: string | null;
  port: number;
  user?: string | null;
  pass?: string | null;
  from: string;
  secureMode?: string | null;
};

type SystemEmailProfileRow = {
  profile: string;
  host: string | null;
  port: number;
  username: string | null;
  password: string | null;
  fromEmail: string | null;
  fromName: string | null;
  secureMode: string;
  isEnabled: boolean | number;
};

async function ensureSystemEmailProfileTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SystemEmailProfile" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "profile" TEXT NOT NULL UNIQUE,
      "host" TEXT,
      "port" INTEGER NOT NULL DEFAULT 587,
      "username" TEXT,
      "password" TEXT,
      "fromEmail" TEXT,
      "fromName" TEXT,
      "secureMode" TEXT NOT NULL DEFAULT 'STARTTLS',
      "isEnabled" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getDbProfileConfig(profile: MailProfile): Promise<ProfileConfig | null> {
  await ensureSystemEmailProfileTable();
  const rows = await prisma.$queryRawUnsafe<SystemEmailProfileRow[]>(
    `SELECT * FROM "SystemEmailProfile" WHERE "profile" = ? LIMIT 1`,
    profile
  );
  const saved = rows[0];
  if (!saved?.isEnabled) return null;

  const fromEmail = saved.fromEmail || (profile === "newsletter" ? "info@britsyncai.com" : "noreply@britsyncai.com");
  const fromName = saved.fromName || "BritCRM";

  return {
    host: saved.host,
    port: saved.port,
    user: saved.username,
    pass: saved.password,
    from: `${fromName} <${fromEmail}>`,
    secureMode: saved.secureMode,
  };
}

function getEnvProfileConfig(profile: MailProfile): ProfileConfig {
  const host = process.env.SYSTEM_SMTP_HOST;
  const password = process.env.SYSTEM_SMTP_PASSWORD;

  if (profile === "newsletter") {
    return {
      host,
      port: parseInt(process.env.SYSTEM_SMTP_PORT_NEWSLETTER || "587", 10),
      user: process.env.SYSTEM_SMTP_USER_NEWSLETTER,
      pass: password,
      from: process.env.SYSTEM_SMTP_FROM_NEWSLETTER || "BritCRM <info@britsyncai.com>",
    };
  }

  return {
    host,
    port: parseInt(process.env.SYSTEM_SMTP_PORT_TRANSACTIONAL || "587", 10),
    user: process.env.SYSTEM_SMTP_USER_TRANSACTIONAL,
    pass: password,
    from: process.env.SYSTEM_SMTP_FROM_TRANSACTIONAL || "BritCRM <noreply@britsyncai.com>",
  };
}

async function getProfileConfig(profile: MailProfile): Promise<ProfileConfig> {
  return (await getDbProfileConfig(profile)) || getEnvProfileConfig(profile);
}

async function isConfigured(profile: MailProfile): Promise<boolean> {
  const { host, user, pass } = await getProfileConfig(profile);
  return !!(host && user && pass);
}

async function createTransport(profile: MailProfile) {
  const { host, port, user, pass, secureMode } = await getProfileConfig(profile);
  const mode = (secureMode || "").toUpperCase();
  const secure = port === 465 || mode === "SSL" || mode === "SSL/TLS";

  return nodemailer.createTransport({
    host: host!,
    port,
    secure,
    requireTLS: !secure && (mode === "TLS" || mode === "STARTTLS"),
    auth: { user: user!, pass: pass! },
  });
}

export async function sendSystemEmail({
  to,
  subject,
  html,
  profile = "transactional",
}: {
  to: string;
  subject: string;
  html: string;
  profile?: MailProfile;
}) {
  if (!(await isConfigured(profile))) {
    console.log(`[SystemMailer] SMTP not configured for profile "${profile}". Would send email:
      To: ${to}
      Subject: ${subject}
      Body: ${html.substring(0, 200)}...`);
    return { sent: false, reason: "SMTP not configured" };
  }

  const { from } = await getProfileConfig(profile);
  const transporter = await createTransport(profile);

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: html.replace(/<[^>]*>?/gm, ""),
    });
    return { sent: true };
  } catch (err) {
    console.error("[SystemMailer] Error sending system email:", err);
    const message = err instanceof Error ? err.message : String(err);
    if (/From domain .*not verified/i.test(message)) {
      return { sent: false, reason: "SMTP From domain is not verified for this account" };
    }
    return { sent: false, error: err };
  }
}
