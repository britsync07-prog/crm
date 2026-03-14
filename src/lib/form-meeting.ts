import { RoomServiceClient } from "livekit-server-sdk";
import { prisma } from "@/lib/db";
import { sendRealEmail } from "@/lib/mailer";

const DEFAULT_START = "09:00";
const DEFAULT_END = "17:00";
const SLOT_MINUTES = 60;

export type AvailabilitySlot = {
  start: string;
  end: string;
  label: string;
};

function parseHourMinute(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(":").map((n) => Number.parseInt(n, 10));
  return {
    hours: Number.isFinite(h) ? h : 9,
    minutes: Number.isFinite(m) ? m : 0,
  };
}

function toUtcDateAtTime(date: Date, time: string): Date {
  const { hours, minutes } = parseHourMinute(time);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function overlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function getPublicMeetingUrl(meetingId: string, requestOrigin?: string): string {
  const envBase = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  const localBase = `http://127.0.0.1:${process.env.PORT || "3001"}`;
  const base = (requestOrigin || envBase || localBase).replace(/\/$/, "");
  return `${base}/meet/${meetingId}`;
}

export async function getReminderEmailAccountIdForUser(userId: string): Promise<string | null> {
  const settings = await prisma.calendarSettings.findUnique({
    where: { userId },
    select: { reminderAccountId: true },
  });

  if (settings?.reminderAccountId) return settings.reminderAccountId;

  const firstActive = await prisma.emailAccount.findFirst({
    where: { userId, isActive: true },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  return firstActive?.id ?? null;
}

export async function getFormAvailability(formId: string, dateIso: string): Promise<{ slots: AvailabilitySlot[]; durationMin: number }> {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: {
      ownerId: true,
      meetingSchedulingEnabled: true,
      meetingDurationMin: true,
    },
  });

  if (!form || !form.meetingSchedulingEnabled) {
    return { slots: [], durationMin: SLOT_MINUTES };
  }

  const durationMin = form.meetingDurationMin || SLOT_MINUTES;
  const day = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(day.getTime())) {
    return { slots: [], durationMin };
  }

  const settings = await prisma.calendarSettings.findUnique({
    where: { userId: form.ownerId },
    select: { availableStart: true, availableEnd: true },
  });

  const dayStart = toUtcDateAtTime(day, settings?.availableStart || DEFAULT_START);
  const dayEnd = toUtcDateAtTime(day, settings?.availableEnd || DEFAULT_END);
  const now = new Date();

  if (dayEnd <= dayStart) {
    return { slots: [], durationMin };
  }

  const conflicts = await prisma.calendarEvent.findMany({
    where: {
      userId: form.ownerId,
      start: { lt: dayEnd },
      end: { gt: dayStart },
    },
    select: { start: true, end: true },
  });

  const slots: AvailabilitySlot[] = [];
  const cursor = new Date(dayStart);

  while (cursor < dayEnd) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60_000);

    if (slotEnd > dayEnd) break;

    const inPast = slotStart <= now;
    const hasConflict = conflicts.some((c) => overlap(slotStart, slotEnd, c.start, c.end));

    if (!inPast && !hasConflict) {
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        label: `${slotStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${slotEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      });
    }

    cursor.setMinutes(cursor.getMinutes() + durationMin);
  }

  return { slots, durationMin };
}

export async function assertSlotFree(ownerId: string, start: Date, end: Date): Promise<void> {
  const conflicting = await prisma.calendarEvent.findFirst({
    where: {
      userId: ownerId,
      start: { lt: end },
      end: { gt: start },
    },
    select: { id: true },
  });

  if (conflicting) {
    const err = new Error("Selected slot is no longer available");
    (err as Error & { status?: number }).status = 409;
    throw err;
  }
}

export async function createLiveKitRoomForMeeting(meetingRoomId: string, endTime: Date): Promise<void> {
  const livekitHost = process.env.LIVEKIT_HOST || "http://localhost:7880";
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit credentials are missing");
  }

  const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
  await roomService.createRoom({
    name: meetingRoomId,
    emptyTimeout: 120,
    maxParticipants: 12,
    metadata: JSON.stringify({ endTime: endTime.getTime() }),
  });
}

export async function deleteLiveKitRoomSafe(meetingRoomId: string): Promise<void> {
  const livekitHost = process.env.LIVEKIT_HOST || "http://localhost:7880";
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) return;

  try {
    const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
    await roomService.deleteRoom(meetingRoomId);
  } catch {
    // Room may already be closed/deleted.
  }
}

export async function sendMeetingConfirmationEmails(params: {
  creatorUserId: string;
  creatorEmail: string;
  submitterEmail: string;
  meetingTitle: string;
  meetingUrl: string;
  startTime: Date;
  endTime: Date;
}): Promise<{ sent: boolean; reason?: string }> {
  const accountId = await getReminderEmailAccountIdForUser(params.creatorUserId);
  if (!accountId) return { sent: false, reason: "No sender email account configured" };

  const body = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Meeting Confirmed</h2>
      <p>Your meeting has been booked.</p>
      <p><strong>${params.meetingTitle}</strong></p>
      <p>Start: ${params.startTime.toLocaleString()}</p>
      <p>End: ${params.endTime.toLocaleString()}</p>
      <p>Join URL: <a href="${params.meetingUrl}">${params.meetingUrl}</a></p>
    </div>
  `;

  await sendRealEmail({
    emailAccountId: accountId,
    to: params.submitterEmail,
    subject: `Meeting confirmed: ${params.meetingTitle}`,
    body,
  });

  await sendRealEmail({
    emailAccountId: accountId,
    to: params.creatorEmail,
    subject: `New form meeting booked: ${params.meetingTitle}`,
    body,
  });

  return { sent: true };
}

export async function sendMeetingCancellationEmails(params: {
  creatorUserId: string;
  creatorEmail: string;
  submitterEmail: string;
  meetingTitle: string;
  meetingUrl: string;
  startTime: Date;
  endTime: Date;
}): Promise<void> {
  const accountId = await getReminderEmailAccountIdForUser(params.creatorUserId);
  if (!accountId) return;

  const body = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Meeting Canceled</h2>
      <p>This meeting was canceled.</p>
      <p><strong>${params.meetingTitle}</strong></p>
      <p>Originally scheduled: ${params.startTime.toLocaleString()} - ${params.endTime.toLocaleString()}</p>
      <p>Room URL: ${params.meetingUrl}</p>
    </div>
  `;

  await sendRealEmail({
    emailAccountId: accountId,
    to: params.submitterEmail,
    subject: `Meeting canceled: ${params.meetingTitle}`,
    body,
  });

  await sendRealEmail({
    emailAccountId: accountId,
    to: params.creatorEmail,
    subject: `Meeting canceled: ${params.meetingTitle}`,
    body,
  });
}

export async function sendMeetingReminderEmails(params: {
  creatorUserId: string;
  creatorEmail: string;
  submitterEmail: string;
  meetingTitle: string;
  meetingUrl: string;
  startTime: Date;
  endTime: Date;
}): Promise<void> {
  const accountId = await getReminderEmailAccountIdForUser(params.creatorUserId);
  if (!accountId) return;

  const body = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Meeting Reminder</h2>
      <p>Your meeting starts soon.</p>
      <p><strong>${params.meetingTitle}</strong></p>
      <p>Start: ${params.startTime.toLocaleString()}</p>
      <p>End: ${params.endTime.toLocaleString()}</p>
      <p>Join URL: <a href="${params.meetingUrl}">${params.meetingUrl}</a></p>
    </div>
  `;

  await sendRealEmail({
    emailAccountId: accountId,
    to: params.submitterEmail,
    subject: `Reminder: ${params.meetingTitle}`,
    body,
  });

  await sendRealEmail({
    emailAccountId: accountId,
    to: params.creatorEmail,
    subject: `Reminder: ${params.meetingTitle}`,
    body,
  });
}

export function makeMeetingRoomId(): string {
  return Math.random().toString(36).slice(2, 10);
}
