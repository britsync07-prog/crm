import crypto from "crypto";

const SECRET = process.env.SYSTEM_SMTP_PASSWORD || "britcrm-unsubscribe-secret";

export function generateUnsubscribeSignature(userId: string): string {
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(userId);
  return hmac.digest("hex");
}

export function verifyUnsubscribeSignature(userId: string, signature: string): boolean {
  const expected = generateUnsubscribeSignature(userId);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
