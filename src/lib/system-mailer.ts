import nodemailer from "nodemailer";

type MailProfile = "transactional" | "newsletter";

function getProfileConfig(profile: MailProfile) {
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
    port: parseInt(process.env.SYSTEM_SMTP_PORT_TRANSACTIONAL || "589", 10),
    user: process.env.SYSTEM_SMTP_USER_TRANSACTIONAL,
    pass: password,
    from: process.env.SYSTEM_SMTP_FROM_TRANSACTIONAL || "BritCRM <noreply@britsyncai.com>",
  };
}

function isConfigured(profile: MailProfile): boolean {
  const { host, user, pass } = getProfileConfig(profile);
  return !!(host && user && pass);
}

function createTransport(profile: MailProfile) {
  const { host, port, user, pass } = getProfileConfig(profile);
  return nodemailer.createTransport({
    host: host!,
    port,
    secure: port === 465,
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
  if (!isConfigured(profile)) {
    console.log(`[SystemMailer] SMTP not configured for profile "${profile}". Would send email:
      To: ${to}
      Subject: ${subject}
      Body: ${html.substring(0, 200)}...`);
    return { sent: false, reason: "SMTP not configured" };
  }

  const { from } = getProfileConfig(profile);
  const transporter = createTransport(profile);

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: html.replace(/<[^>]*>?/gm, ""),
  });

  return { sent: true };
}
