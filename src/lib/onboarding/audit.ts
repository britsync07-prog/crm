import { prisma } from "@/lib/db";

export type AuditActorType = "USER" | "AI" | "CLIENT" | "SYSTEM";

export interface LogAuditEventOptions {
  onboardingId: string;
  actorId?: string;
  actorType: AuditActorType;
  action: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export async function logOnboardingAudit(options: LogAuditEventOptions) {
  try {
    return await prisma.onboardingAuditEvent.create({
      data: {
        onboardingId: options.onboardingId,
        actorId: options.actorId || options.actorType,
        actorType: options.actorType,
        action: options.action,
        details: options.details,
        metadataJson: options.metadata ? JSON.stringify(options.metadata) : null,
        ipAddress: options.ipAddress || null,
      },
    });
  } catch (error) {
    console.error("[OnboardingAudit] Failed to record audit event:", error);
    return null;
  }
}
