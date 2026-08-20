import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prisma } from "../../lib/db.js";
import { getAppBaseUrl } from "../../lib/app-url.js";
import {
  createLiveKitRoomForMeeting,
  getFormAvailability,
  getPublicMeetingUrl,
  makeMeetingRoomId,
  sendMeetingConfirmationEmails,
} from "../../lib/form-meeting.js";
import { ensureCustomerFromLead, upsertLeadFromFormSubmission } from "../../lib/crm-lifecycle.js";
import { getMcpContext } from "../context.js";

const fieldTypeSchema = z.enum(["TEXT", "TEXTAREA", "DROPDOWN", "RADIO", "CHECKBOX", "EMAIL", "PHONE"]);
const fieldSchema = z.object({
  label: z.string().min(1),
  type: fieldTypeSchema,
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
});

function jsonResult(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

async function runTool<T>(operation: () => Promise<T>) {
  try {
    const data = await operation();
    return jsonResult({ success: true, data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResult({ success: false, data: null, error: message });
  }
}

function publicFormUrl(formId: string) {
  return `${getAppBaseUrl()}/f/${formId}`;
}

function parseFieldOptions(options: string | null) {
  if (!options) return [];
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function findOwnedForm(userId: string, formId: string) {
  const form = await prisma.form.findFirst({
    where: { id: formId, ownerId: userId },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!form) throw new Error("Form not found for this MCP user.");
  return form;
}

function validateRequiredFields(
  fields: Array<{ id: string; label: string; required: boolean }>,
  responses: Record<string, unknown>
) {
  for (const field of fields) {
    const value = responses[field.id];
    const emptyArray = Array.isArray(value) && value.length === 0;
    const emptyValue = value === undefined || value === null || value === "";
    if (field.required && (emptyArray || emptyValue)) {
      throw new Error(`Field "${field.label}" is required.`);
    }
  }
}

function findSubmitterEmail(
  responses: Record<string, unknown>,
  fields: Array<{ id: string; label: string }>
) {
  const emailField = fields.find((field) => field.label.toLowerCase().includes("email"));
  const raw = emailField ? responses[emailField.id] : null;
  return typeof raw === "string" && raw.includes("@") ? raw.trim().toLowerCase() : "";
}

export function registerFormTools(server: McpServer) {
  server.registerTool(
    "forms.list",
    {
      title: "List Forms",
      description: "List forms owned by the MCP user.",
      inputSchema: {
        search: z.string().optional(),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      },
    },
    async ({ search, limit, offset }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const where = {
          ownerId: context.userId,
          ...(search
            ? {
                OR: [
                  { title: { contains: search } },
                  { description: { contains: search } },
                ],
              }
            : {}),
        };

        const [total, forms] = await Promise.all([
          prisma.form.count({ where }),
          prisma.form.findMany({
            where,
            include: { _count: { select: { submissions: true } } },
            orderBy: { createdAt: "desc" },
            skip: offset,
            take: limit,
          }),
        ]);

        return {
          total,
          offset,
          limit,
          forms: forms.map((form) => ({
            id: form.id,
            title: form.title,
            description: form.description,
            meetingSchedulingEnabled: form.meetingSchedulingEnabled,
            meetingDurationMin: form.meetingDurationMin,
            submissionCount: form._count.submissions,
            publicUrl: publicFormUrl(form.id),
            createdAt: form.createdAt,
            updatedAt: form.updatedAt,
          })),
        };
      })
  );

  server.registerTool(
    "forms.create",
    {
      title: "Create Form",
      description: "Create a form with ordered fields for the MCP user.",
      inputSchema: {
        title: z.string().min(1),
        description: z.string().optional(),
        fields: z.array(fieldSchema).min(1),
        meetingSchedulingEnabled: z.boolean().default(false),
        meetingDurationMin: z.number().int().min(30).max(240).default(60),
      },
    },
    async ({ title, description, fields, meetingSchedulingEnabled, meetingDurationMin }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const form = await prisma.form.create({
          data: {
            title,
            description,
            ownerId: context.userId,
            meetingSchedulingEnabled,
            meetingDurationMin,
            fields: {
              create: fields.map((field, index) => ({
                label: field.label,
                type: field.type,
                required: field.required,
                options: field.options.length > 0 ? JSON.stringify(field.options) : null,
                order: index,
              })),
            },
          },
          include: { fields: { orderBy: { order: "asc" } } },
        });

        return {
          ...form,
          fields: form.fields.map((field) => ({ ...field, options: parseFieldOptions(field.options) })),
          publicUrl: publicFormUrl(form.id),
        };
      })
  );

  server.registerTool(
    "forms.delete",
    {
      title: "Delete Form",
      description: "Delete a user-owned form and its submissions after confirmation.",
      inputSchema: {
        formId: z.string().min(1),
        confirm: z.boolean().default(false),
      },
    },
    async ({ formId, confirm }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const form = await prisma.form.findFirst({
          where: { id: formId, ownerId: context.userId },
          include: { _count: { select: { submissions: true, fields: true } } },
        });
        if (!form) throw new Error("Form not found for this MCP user.");

        if (!confirm) {
          return {
            preview: true,
            message: "Set confirm=true to delete this form and all submissions.",
            form: {
              id: form.id,
              title: form.title,
              fieldCount: form._count.fields,
              submissionCount: form._count.submissions,
            },
          };
        }

        await prisma.form.delete({ where: { id: form.id } });
        return { deleted: true, formId: form.id };
      })
  );

  server.registerTool(
    "forms.get_submissions",
    {
      title: "Get Form Submissions",
      description: "Read parsed submissions for a user-owned form with CRM links.",
      inputSchema: {
        formId: z.string().min(1),
      },
    },
    async ({ formId }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const form = await prisma.form.findFirst({
          where: { id: formId, ownerId: context.userId },
          include: {
            fields: { orderBy: { order: "asc" } },
            submissions: { orderBy: { createdAt: "desc" } },
          },
        });
        if (!form) throw new Error("Form not found for this MCP user.");

        const parsed = form.submissions.map((submission) => {
          const data = JSON.parse(submission.data) as Record<string, unknown>;
          const booked = data.__meetingBooking && typeof data.__meetingBooking === "object";
          const submitterEmail =
            typeof (data.__meetingBooking as { submitterEmail?: unknown } | undefined)?.submitterEmail === "string"
              ? String((data.__meetingBooking as { submitterEmail: string }).submitterEmail).trim().toLowerCase()
              : findSubmitterEmail(data, form.fields);

          return { ...submission, data, submitterEmail: submitterEmail || null, meetingBooked: Boolean(booked) };
        });

        const emails = Array.from(new Set(parsed.map((submission) => submission.submitterEmail).filter(Boolean) as string[]));
        const [leads, customers] = await Promise.all([
          emails.length
            ? prisma.lead.findMany({
                where: { userId: context.userId, email: { in: emails } },
                select: { id: true, email: true, status: true },
              })
            : Promise.resolve([]),
          emails.length
            ? prisma.customer.findMany({
                where: { userId: context.userId, email: { in: emails } },
                select: { id: true, email: true, status: true },
              })
            : Promise.resolve([]),
        ]);
        const leadByEmail = new Map(leads.map((lead) => [lead.email.toLowerCase(), lead]));
        const customerByEmail = new Map(customers.map((customer) => [customer.email.toLowerCase(), customer]));

        return {
          form: {
            id: form.id,
            title: form.title,
            fields: form.fields.map((field) => ({ ...field, options: parseFieldOptions(field.options) })),
          },
          submissions: parsed.map((submission) => ({
            ...submission,
            crm: {
              lead: submission.submitterEmail ? leadByEmail.get(submission.submitterEmail) || null : null,
              customer: submission.submitterEmail ? customerByEmail.get(submission.submitterEmail) || null : null,
            },
          })),
        };
      })
  );

  server.registerTool(
    "forms.submit_public",
    {
      title: "Submit Public Form",
      description: "Submit a user-owned public form as an MCP-driven intake action.",
      inputSchema: {
        formId: z.string().min(1),
        responses: z.record(z.string(), z.unknown()).default({}),
        meeting: z
          .object({
            book: z.boolean().default(false),
            email: z.string().email().optional(),
            slotStart: z.string().optional(),
          })
          .optional(),
      },
    },
    async ({ formId, responses, meeting }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const form = await findOwnedForm(context.userId, formId);
        validateRequiredFields(form.fields, responses);

        if (!form.meetingSchedulingEnabled || !meeting?.book) {
          const submission = await prisma.formSubmission.create({
            data: { formId: form.id, data: JSON.stringify(responses) },
          });

          const lead = await upsertLeadFromFormSubmission({
            ownerId: form.ownerId,
            formId: form.id,
            formTitle: form.title,
            submissionId: submission.id,
            responses,
            fields: form.fields.map((field) => ({ id: field.id, label: field.label })),
            meetingBooked: false,
          });

          return { submissionId: submission.id, leadId: lead?.id || null, meeting: null };
        }

        const submitterEmail = (meeting.email || "").trim().toLowerCase();
        if (!submitterEmail) throw new Error("Valid meeting.email is required for meeting booking.");
        if (!meeting.slotStart) throw new Error("meeting.slotStart is required for meeting booking.");

        const start = new Date(meeting.slotStart);
        if (Number.isNaN(start.getTime())) throw new Error("Invalid meeting slot time.");
        if (start <= new Date()) throw new Error("Meeting slot must be in the future.");

        const durationMin = form.meetingDurationMin || 60;
        const end = new Date(start.getTime() + durationMin * 60_000);
        const availability = await getFormAvailability(form.id, start.toISOString().slice(0, 10));
        const stillAvailable = availability.slots.some((slot) => slot.start === start.toISOString());
        if (!stillAvailable) throw new Error("Selected slot is not available.");

        const roomMeetingId = makeMeetingRoomId();
        const created = await prisma.$transaction(async (tx) => {
          const conflict = await tx.calendarEvent.findFirst({
            where: { userId: form.ownerId, start: { lt: end }, end: { gt: start } },
            select: { id: true },
          });
          if (conflict) throw new Error("Selected slot is no longer available.");

          const submission = await tx.formSubmission.create({
            data: {
              formId: form.id,
              data: JSON.stringify({
                ...responses,
                __meetingBooking: { submitterEmail, start: start.toISOString(), end: end.toISOString() },
              }),
            },
          });

          const meetingRecord = await tx.meeting.create({
            data: {
              title: `${form.title} - Scheduled Call`,
              meetingId: roomMeetingId,
              hostId: form.ownerId,
              startTime: start,
              endTime: end,
              status: "ACTIVE",
              formId: form.id,
              formSubmissionId: submission.id,
              submitterEmail,
            },
          });

          const calendarEvent = await tx.calendarEvent.create({
            data: {
              userId: form.ownerId,
              title: `Form Meeting: ${form.title}`,
              description: `Booked via MCP form submission. Submitter: ${submitterEmail}`,
              start,
              end,
              isLocked: true,
              source: "FORM_MEETING",
              meetingId: meetingRecord.id,
              externalMeta: JSON.stringify({ submitterEmail, formId: form.id, submissionId: submission.id, roomMeetingId }),
            },
          });

          return { submission, meetingRecord, calendarEvent };
        });

        try {
          await createLiveKitRoomForMeeting(roomMeetingId, end);
        } catch (error) {
          await prisma.$transaction([
            prisma.calendarEvent.delete({ where: { id: created.calendarEvent.id } }),
            prisma.meeting.update({ where: { id: created.meetingRecord.id }, data: { status: "CANCELED" } }),
          ]);
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(`Meeting room could not be created: ${message}`);
        }

        const meetingUrl = getPublicMeetingUrl(roomMeetingId);
        await prisma.$transaction([
          prisma.meeting.update({ where: { id: created.meetingRecord.id }, data: { metadata: JSON.stringify({ meetingUrl }) } }),
          prisma.calendarEvent.update({
            where: { id: created.calendarEvent.id },
            data: {
              externalMeta: JSON.stringify({
                submitterEmail,
                formId: form.id,
                submissionId: created.submission.id,
                roomMeetingId,
                meetingUrl,
              }),
            },
          }),
        ]);

        const lead = await upsertLeadFromFormSubmission({
          ownerId: form.ownerId,
          formId: form.id,
          formTitle: form.title,
          submissionId: created.submission.id,
          responses,
          fields: form.fields.map((field) => ({ id: field.id, label: field.label })),
          preferredEmail: submitterEmail,
          meetingBooked: true,
        });
        if (lead) await ensureCustomerFromLead(lead.id, form.ownerId, { markLeadConverted: false });

        const emailResult = await sendMeetingConfirmationEmails({
          creatorUserId: context.userId,
          creatorEmail: context.email,
          submitterEmail,
          meetingTitle: created.meetingRecord.title,
          meetingUrl,
          startTime: start,
          endTime: end,
        }).catch((error) => ({ sent: false, reason: error instanceof Error ? error.message : String(error) }));

        return {
          submissionId: created.submission.id,
          leadId: lead?.id || null,
          meeting: {
            id: created.meetingRecord.id,
            roomId: roomMeetingId,
            meetingUrl,
            start: start.toISOString(),
            end: end.toISOString(),
          },
          emails: emailResult,
        };
      })
  );

  server.registerTool(
    "forms.generate_share_message",
    {
      title: "Generate Form Share Message",
      description: "Generate a concise message containing the public form link.",
      inputSchema: {
        formId: z.string().min(1),
        recipientName: z.string().optional(),
        tone: z.string().default("professional"),
      },
    },
    async ({ formId, recipientName, tone }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const form = await findOwnedForm(context.userId, formId);
        const greeting = recipientName ? `Hi ${recipientName},` : "Hi,";
        const message = `${greeting}\n\nPlease complete this form so we can collect the details we need: ${publicFormUrl(form.id)}\n\nThank you,\n${context.email}`;
        return { formId: form.id, title: form.title, tone, publicUrl: publicFormUrl(form.id), message };
      })
  );
}

