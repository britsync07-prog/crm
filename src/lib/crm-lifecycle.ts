import { prisma } from "@/lib/db";

export const LEAD_STAGES = {
  NEW: "New",
  CONTACTED: "Contacted",
  INBOUND: "Inbound Client",
  MEETING_BOOKED: "Meeting Booked",
  QUALIFIED: "Qualified",
  CONVERTED: "Converted",
} as const;

export type LeadStage = (typeof LEAD_STAGES)[keyof typeof LEAD_STAGES];

const STAGE_ORDER: Record<LeadStage, number> = {
  [LEAD_STAGES.NEW]: 10,
  [LEAD_STAGES.CONTACTED]: 20,
  [LEAD_STAGES.INBOUND]: 30,
  [LEAD_STAGES.MEETING_BOOKED]: 40,
  [LEAD_STAGES.QUALIFIED]: 50,
  [LEAD_STAGES.CONVERTED]: 60,
};

type TransitionInput = {
  leadId: string;
  nextStage: LeadStage;
  reason: string;
  force?: boolean;
};

function normalizeEmail(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

function findFieldValueByLabel(
  responses: Record<string, unknown>,
  fields: Array<{ id: string; label: string }>,
  keywords: string[]
): string | null {
  const field = fields.find((f) => keywords.some((k) => f.label.toLowerCase().includes(k)));
  if (!field) return null;
  const raw = responses[field.id];
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return null;
}

export async function transitionLeadStage(input: TransitionInput) {
  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    select: { id: true, status: true },
  });
  if (!lead) return null;

  const current = lead.status as LeadStage;
  const currentRank = STAGE_ORDER[current] ?? 0;
  const nextRank = STAGE_ORDER[input.nextStage] ?? 0;
  const shouldUpdate = input.force || nextRank >= currentRank;

  if (!shouldUpdate) return lead;

  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: { status: input.nextStage },
  });

  await prisma.interaction.create({
    data: {
      leadId: lead.id,
      type: "System",
      content: `Lead stage updated to "${input.nextStage}". Reason: ${input.reason}`,
    },
  });

  return updated;
}

type UpsertInboundLeadInput = {
  ownerId: string;
  formId: string;
  formTitle: string;
  submissionId: string;
  responses: Record<string, unknown>;
  fields: Array<{ id: string; label: string }>;
  preferredEmail?: string | null;
  meetingBooked?: boolean;
};

export async function upsertLeadFromFormSubmission(input: UpsertInboundLeadInput) {
  const emailFromForm = findFieldValueByLabel(input.responses, input.fields, ["email", "e-mail"]);
  const submitterEmail = normalizeEmail(input.preferredEmail || emailFromForm);
  if (!submitterEmail || !isEmail(submitterEmail)) {
    return null;
  }

  const name =
    findFieldValueByLabel(input.responses, input.fields, ["name", "full name"]) ||
    submitterEmail.split("@")[0];
  const phone = findFieldValueByLabel(input.responses, input.fields, ["phone", "mobile", "whatsapp"]);
  const company = findFieldValueByLabel(input.responses, input.fields, ["company", "business", "organization"]);

  const existing = await prisma.lead.findUnique({ where: { email: submitterEmail } });
  if (existing && existing.userId !== input.ownerId) {
    return null;
  }

  const targetStage = input.meetingBooked ? LEAD_STAGES.MEETING_BOOKED : LEAD_STAGES.INBOUND;
  const lead = existing
    ? await prisma.lead.update({
        where: { id: existing.id },
        data: {
          name: existing.name || name,
          phone: existing.phone || phone,
          company: existing.company || company,
          source: existing.source || "Form Submission",
        },
      })
    : await prisma.lead.create({
        data: {
          userId: input.ownerId,
          name,
          email: submitterEmail,
          phone,
          company,
          source: "Form Submission",
          status: LEAD_STAGES.NEW,
        },
      });

  await transitionLeadStage({
    leadId: lead.id,
    nextStage: targetStage,
    reason: `Inbound submission (${input.formTitle})`,
  });

  await prisma.interaction.create({
    data: {
      leadId: lead.id,
      type: "Form Submission",
      content: `Submitted form "${input.formTitle}" (${input.formId}). Submission ID: ${input.submissionId}`,
    },
  });

  return prisma.lead.findUnique({ where: { id: lead.id } });
}

export async function ensureCustomerFromLead(
  leadId: string,
  userId: string,
  options?: { markLeadConverted?: boolean }
) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.userId !== userId) return null;

  const existing = await prisma.customer.findUnique({ where: { email: lead.email } });
  if (existing && existing.userId !== userId) {
    return null;
  }

  if (existing) {
    const updated = await prisma.customer.update({
      where: { id: existing.id },
      data: {
        name: existing.name || lead.name,
        phone: existing.phone || lead.phone,
        company: existing.company || lead.company,
        status: existing.status || "Potential",
      },
    });
    if (options?.markLeadConverted !== false) {
      await transitionLeadStage({
        leadId: lead.id,
        nextStage: LEAD_STAGES.CONVERTED,
        reason: "Existing customer matched by email",
        force: true,
      });
    }
    return updated;
  }

  const customer = await prisma.customer.create({
    data: {
      userId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      licenseType: lead.licenseType,
      areaOfOperation: lead.areaOfOperation,
      dealFocus: lead.dealFocus,
      budgetRange: lead.budgetRange,
      status: "Potential",
    },
  });

  if (options?.markLeadConverted !== false) {
    await transitionLeadStage({
      leadId: lead.id,
      nextStage: LEAD_STAGES.CONVERTED,
      reason: "Lead converted to customer",
      force: true,
    });
  }

  return customer;
}
