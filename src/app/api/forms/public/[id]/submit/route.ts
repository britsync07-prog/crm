import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createLiveKitRoomForMeeting,
  getFormAvailability,
  getReminderEmailAccountIdForUser,
  getPublicMeetingUrl,
  makeMeetingRoomId,
  sendMeetingConfirmationEmails,
} from "@/lib/form-meeting";
import { ensureCustomerFromLead, upsertLeadFromFormSubmission } from "@/lib/crm-lifecycle";

type MeetingPayload = {
  book?: boolean;
  email?: string;
  slotStart?: string;
};

function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        fields: true,
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const responses = (body?.responses ?? body) as Record<string, unknown>;
    const meeting = (body?.meeting ?? null) as MeetingPayload | null;

    for (const field of form.fields) {
      const value = responses?.[field.id];
      if (field.required) {
        const emptyArray = Array.isArray(value) && value.length === 0;
        const emptyValue = value === undefined || value === null || value === "";
        if (emptyArray || emptyValue) {
          return NextResponse.json({ error: `Field "${field.label}" is required` }, { status: 400 });
        }
      }
    }

    if (!form.meetingSchedulingEnabled || !meeting?.book) {
      const submission = await prisma.formSubmission.create({
        data: {
          formId: id,
          data: JSON.stringify(responses || {}),
        },
      });

      await upsertLeadFromFormSubmission({
        ownerId: form.ownerId,
        formId: form.id,
        formTitle: form.title,
        submissionId: submission.id,
        responses: responses || {},
        fields: form.fields.map((f) => ({ id: f.id, label: f.label })),
        meetingBooked: false,
      }).catch((err) => {
        console.error("[FormSubmit] Lead sync failed:", err);
      });

      return NextResponse.json({ success: true, submissionId: submission.id });
    }

    const submitterEmail = (meeting.email || "").trim().toLowerCase();
    if (!submitterEmail || !isEmail(submitterEmail)) {
      return NextResponse.json({ error: "Valid email is required for meeting booking" }, { status: 400 });
    }

    if (!meeting.slotStart) {
      return NextResponse.json({ error: "A meeting slot is required" }, { status: 400 });
    }

    const start = new Date(meeting.slotStart);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid slot time" }, { status: 400 });
    }

    if (start <= new Date()) {
      return NextResponse.json({ error: "Meeting slot must be in the future" }, { status: 400 });
    }

    const durationMin = form.meetingDurationMin || 60;
    const end = new Date(start.getTime() + durationMin * 60_000);
    const dayIso = start.toISOString().slice(0, 10);
    const availability = await getFormAvailability(form.id, dayIso);
    const stillAvailable = availability.slots.some((slot) => slot.start === start.toISOString());
    if (!stillAvailable) {
      return NextResponse.json({ error: "Selected slot is not available anymore" }, { status: 409 });
    }

    const senderAccountId = await getReminderEmailAccountIdForUser(form.owner.id);
    if (!senderAccountId) {
      return NextResponse.json(
        { error: "Meeting booking is unavailable because creator email sender is not configured yet" },
        { status: 400 }
      );
    }

    const roomMeetingId = makeMeetingRoomId();

    const created = await prisma.$transaction(async (tx) => {
      const conflict = await tx.calendarEvent.findFirst({
        where: {
          userId: form.ownerId,
          start: { lt: end },
          end: { gt: start },
        },
        select: { id: true },
      });

      if (conflict) {
        const err = new Error("Selected slot is no longer available");
        (err as Error & { status?: number }).status = 409;
        throw err;
      }

      const submission = await tx.formSubmission.create({
        data: {
          formId: id,
          data: JSON.stringify({
            ...(responses || {}),
            __meetingBooking: {
              submitterEmail,
              start: start.toISOString(),
              end: end.toISOString(),
            },
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
          description: `Booked via public form. Submitter: ${submitterEmail}`,
          start,
          end,
          isLocked: true,
          source: "FORM_MEETING",
          meetingId: meetingRecord.id,
          externalMeta: JSON.stringify({
            submitterEmail,
            formId: form.id,
            submissionId: submission.id,
            roomMeetingId,
          }),
        },
      });

      return { submission, meetingRecord, calendarEvent };
    });

    try {
      await createLiveKitRoomForMeeting(roomMeetingId, end);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown LiveKit error";
      await prisma.$transaction([
        prisma.calendarEvent.delete({ where: { id: created.calendarEvent.id } }),
        prisma.meeting.update({ where: { id: created.meetingRecord.id }, data: { status: "CANCELED" } }),
      ]);

      return NextResponse.json(
        { error: "Form submitted, but meeting room could not be created. Please choose another slot.", details: message },
        { status: 502 }
      );
    }

    const origin = new URL(request.url).origin;
    const meetingUrl = getPublicMeetingUrl(roomMeetingId, origin);

    await prisma.$transaction([
      prisma.meeting.update({
        where: { id: created.meetingRecord.id },
        data: { metadata: JSON.stringify({ meetingUrl }) },
      }),
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

    const emailResult = await sendMeetingConfirmationEmails({
      creatorUserId: form.owner.id,
      creatorEmail: form.owner.email,
      submitterEmail,
      meetingTitle: created.meetingRecord.title,
      meetingUrl,
      startTime: start,
      endTime: end,
    }).catch((err) => ({ sent: false, reason: String(err?.message || err) }));

    const syncedLead = await upsertLeadFromFormSubmission({
      ownerId: form.ownerId,
      formId: form.id,
      formTitle: form.title,
      submissionId: created.submission.id,
      responses: responses || {},
      fields: form.fields.map((f) => ({ id: f.id, label: f.label })),
      preferredEmail: submitterEmail,
      meetingBooked: true,
    }).catch((err) => {
      console.error("[FormSubmit] Lead sync failed:", err);
      return null;
    });

    if (syncedLead) {
      await ensureCustomerFromLead(syncedLead.id, form.ownerId, { markLeadConverted: false }).catch((err) => {
        console.error("[FormSubmit] Customer sync failed:", err);
      });
    }

    return NextResponse.json({
      success: true,
      submissionId: created.submission.id,
      meeting: {
        id: created.meetingRecord.id,
        roomId: roomMeetingId,
        meetingUrl,
        start: start.toISOString(),
        end: end.toISOString(),
      },
      emails: emailResult,
    });
  } catch (error: unknown) {
    const status = (typeof error === "object" && error !== null && "status" in error && typeof (error as { status?: unknown }).status === "number")
      ? (error as { status: number }).status
      : 500;
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status });
  }
}
