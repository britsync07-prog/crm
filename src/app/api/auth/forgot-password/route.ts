import { prisma } from "@/lib/db";
import { sendSystemEmail } from "@/lib/system-mailer";
import { resetPasswordEmailTemplate } from "@/lib/email-templates/reset-password";
import { getAppBaseUrl } from "@/lib/app-url";
import crypto from "crypto";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!normalizedEmail) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";

    if (!checkRateLimit(ip)) {
      return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const resetToken = crypto.randomUUID();
      const resetExpires = new Date(Date.now() + 3600000);

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetExpires },
      });

      const baseUrl = getAppBaseUrl();
      const resetLink = `${baseUrl}/reset-password/${resetToken}`;

      const delivery = await sendSystemEmail({
        to: user.email,
        subject: "Reset your BritCRM password",
        html: resetPasswordEmailTemplate(user.name || "there", resetLink),
        profile: "transactional",
      });

      if (!delivery.sent) {
        return Response.json(
          { error: "Password reset email could not be sent. Check transactional SMTP settings." },
          { status: 503 }
        );
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
