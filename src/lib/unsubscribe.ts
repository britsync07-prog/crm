import crypto from "crypto";

function getUnsubscribeSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("UNSUBSCRIBE_SECRET or JWT_SECRET environment variable is required");
  }
  return secret;
}

export function generateUnsubscribeSignature(userId: string): string {
  const hmac = crypto.createHmac("sha256", getUnsubscribeSecret());
  hmac.update(userId);
  return hmac.digest("hex");
}

export function verifyUnsubscribeSignature(userId: string, signature: string): boolean {
  const expected = generateUnsubscribeSignature(userId);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}
