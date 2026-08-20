import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prisma } from "../../lib/db.js";
import {
  createLiveKitRoomForMeeting,
  deleteLiveKitRoomSafe,
  getPublicMeetingUrl,
  makeMeetingRoomId,
  sendMeetingCancellationEmails,
  sendMeetingConfirmationEmails,
} from "../../lib/form-meeting.js";
import { getMcpContext } from "../context.js";

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

function parseDate(value: string, label: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${label}.`);
  return date;
}

function parseTime(value: string, label: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) throw new Error(`${label} must use HH:MM format.`);
  const [hour, minute] = value.split(":").map((part) => Number.parseInt(part, 10));
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`${label} must be a valid HH:MM time.`);
  }
  return { hour, minute };
}

function combineDateAndTime(dateIso: string, time: string) {
  const date = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date.");
  const { hour, minute } = parseTime(time, "Availability time");
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function assertEmailAccountAccess(userId: string, accountId?: string | null) {
  if (!accountId) return null;
  const account = await prisma.emailAccount.findFirst({
    where: { id: accountId, userId, isActive: true },
    select: { id: true },
  });
  if (!account) throw new Error("Reminder email account not found for this MCP user.");
  return account.id;
}

async function assertSlotFree(userId: string, start: Date, end: Date, ignoreEventId?: string) {
  const conflict = await prisma.calendarEvent.findFirst({
    where: {
      userId,
      ...(ignoreEventId ? { id: { not: ignoreEventId } } : {}),
      start: { lt: end },
      end: { gt: start },
    },
    select: { id: true, title: true, start: true, end: true },
  });

  if (conflict) {
    throw new Error(`Time slot conflicts with "${conflict.title}" (${conflict.start.toISOString()} - ${conflict.end.toISOString()}).`);
  }
}

async function getOrDefaultCalendarSettings(userId: string) {
  const settings = await prisma.calendarSettings.findUnique({ where: { userId } });
  return (
    settings || {
      id: null,
      userId,
      availableStart: "09:00",
      availableEnd: "17:00",
      timeZone: "UTC",
      reminderAccountId: null,
      createdAt: null,
      updatedAt: null,
    }
  );
}

export function registerCalendarTools(server: McpServer) {
  server.registerTool(
    "calendar.get_settings",
    {
      title: "Get Calendar Settings",
      description: "Get availability settings for the MCP user.",
      inputSchema: {},
    },
    async () =>
      runTool(async () => {
        const context = await getMcpContext();
        return getOrDefaultCalendarSettings(context.userId);
      })
  );

  server.registerTool(
    "calendar.update_settings",
    {
      title: "Update Calendar Settings",
      description: "Update availability settings and reminder sender account for the MCP user.",
      inputSchema: {
        availableStart: z.string().default("09:00"),
        availableEnd: z.string().default("17:00"),
        timeZone: z.string().default("UTC"),
        reminderAccountId: z.string().nullable().optional(),
      },
    },
    async ({ availableStart, availableEnd, timeZone, reminderAccountId }) =>
      runTool(async () => {
        const context = await getMcpContext();
        parseTime(availableStart, "availableStart");
        parseTime(availableEnd, "availableEnd");
        const start = combineDateAndTime("2026-01-01", availableStart);
        const end = combineDateAndTime("2026-01-01", availableEnd);
        if (end <= start) throw new Error("availableEnd must be after availableStart.");
        const accountId = await assertEmailAccountAccess(context.userId, reminderAccountId);

        return prisma.calendarSettings.upsert({
          where: { userId: context.userId },
          update: { availableStart, availableEnd, timeZone, reminderAccountId: accountId },
          create: { userId: context.userId, availableStart, availableEnd, timeZone, reminderAccountId: accountId },
        });
      })
  );

  server.registerTool(
    "calendar.list_events",
    {
      title: "List Calendar Events",
      description: "List events for the MCP user in an optional date range.",
      inputSchema: {
        start: z.string().optional(),
        end: z.string().optional(),
        limit: z.number().int().min(1).max(500).default(200),
      },
    },
    async ({ start, end, limit }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const rangeStart = start ? parseDate(start, "start") : null;
        const rangeEnd = end ? parseDate(end, "end") : null;
        if ((rangeStart && !rangeEnd) || (!rangeStart && rangeEnd)) throw new Error("Both start and end are required for range filtering.");

        return prisma.calendarEvent.findMany({
          where: {
            userId: context.userId,
            ...(rangeStart && rangeEnd ? { start: { lt: rangeEnd }, end: { gt: rangeStart } } : {}),
          },
          orderBy: { start: "asc" },
          take: limit,
        });
      })
  );

  server.registerTool(
    "calendar.check_availability",
    {
      title: "Check Calendar Availability",
      description: "Compute free slots from calendar settings and existing events.",
      inputSchema: {
        date: z.string().min(10),
        durationMin: z.number().int().min(15).max(240).default(60),
      },
    },
    async ({ date, durationMin }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const settings = await getOrDefaultCalendarSettings(context.userId);
        const dayStart = combineDateAndTime(date, settings.availableStart);
        const dayEnd = combineDateAndTime(date, settings.availableEnd);
        const now = new Date();
        const events = await prisma.calendarEvent.findMany({
          where: { userId: context.userId, start: { lt: dayEnd }, end: { gt: dayStart } },
          select: { id: true, title: true, start: true, end: true },
          orderBy: { start: "asc" },
        });

        const slots: Array<{ start: string; end: string; label: string }> = [];
        const cursor = new Date(dayStart);
        while (cursor < dayEnd) {
          const slotStart = new Date(cursor);
          const slotEnd = new Date(slotStart.getTime() + durationMin * 60_000);
          if (slotEnd > dayEnd) break;
          const hasConflict = events.some((event) => slotStart < event.end && slotEnd > event.start);
          if (slotStart > now && !hasConflict) {
            slots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              label: `${slotStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${slotEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
            });
          }
          cursor.setMinutes(cursor.getMinutes() + durationMin);
        }

        return { date, durationMin, settings, busy: events, slots };
      })
  );

  server.registerTool(
    "calendar.create_event",
    {
      title: "Create Calendar Event",
      description: "Create a manual calendar event after conflict checking.",
      inputSchema: {
        title: z.string().min(1),
        description: z.string().optional(),
        start: z.string().min(1),
        end: z.string().min(1),
        source: z.string().default("MCP"),
      },
    },
    async ({ title, description, start, end, source }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const startDate = parseDate(start, "start");
        const endDate = parseDate(end, "end");
        if (endDate <= startDate) throw new Error("End time must be after start time.");
        await assertSlotFree(context.userId, startDate, endDate);

        return prisma.calendarEvent.create({
          data: { userId: context.userId, title, description, start: startDate, end: endDate, source },
        });
      })
  );

  server.registerTool(
    "calendar.book_client_meeting",
    {
      title: "Book Client Meeting",
      description: "Book a client meeting with conflict checks, LiveKit room, calendar event, and optional confirmation email.",
      inputSchema: {
        title: z.string().min(1),
        clientEmail: z.string().email(),
        start: z.string().min(1),
        end: z.string().min(1),
        notes: z.string().optional(),
        sendConfirmation: z.boolean().default(true),
        confirm: z.boolean().default(false),
      },
    },
    async ({ title, clientEmail, start, end, notes, sendConfirmation, confirm }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const startDate = parseDate(start, "start");
        const endDate = parseDate(end, "end");
        if (endDate <= startDate) throw new Error("End time must be after start time.");
        await assertSlotFree(context.userId, startDate, endDate);

        if (!confirm) {
          return {
            preview: true,
            message: "Set confirm=true to book this meeting.",
            title,
            clientEmail,
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          };
        }

        const roomMeetingId = makeMeetingRoomId();
        const meetingUrl = getPublicMeetingUrl(roomMeetingId);
        const created = await prisma.$transaction(async (tx) => {
          const conflict = await tx.calendarEvent.findFirst({
            where: { userId: context.userId, start: { lt: endDate }, end: { gt: startDate } },
            select: { id: true },
          });
          if (conflict) throw new Error("Selected slot is no longer available.");

          const meeting = await tx.meeting.create({
            data: {
              title,
              meetingId: roomMeetingId,
              hostId: context.userId,
              status: "ACTIVE",
              startTime: startDate,
              endTime: endDate,
              submitterEmail: clientEmail,
              metadata: JSON.stringify({ meetingUrl, notes: notes || null }),
            },
          });

          const event = await tx.calendarEvent.create({
            data: {
              userId: context.userId,
              title,
              description: notes || `Client meeting with ${clientEmail}`,
              start: startDate,
              end: endDate,
              isLocked: true,
              source: "MCP_MEETING",
              meetingId: meeting.id,
              externalMeta: JSON.stringify({ clientEmail, roomMeetingId, meetingUrl }),
            },
          });

          return { meeting, event };
        });

        try {
          await createLiveKitRoomForMeeting(roomMeetingId, endDate);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await prisma.$transaction([
            prisma.calendarEvent.delete({ where: { id: created.event.id } }),
            prisma.meeting.update({ where: { id: created.meeting.id }, data: { status: "CANCELED" } }),
          ]);
          throw new Error(`Meeting room could not be created: ${message}`);
        }

        const emailResult = sendConfirmation
          ? await sendMeetingConfirmationEmails({
              creatorUserId: context.userId,
              creatorEmail: context.email,
              submitterEmail: clientEmail,
              meetingTitle: title,
              meetingUrl,
              startTime: startDate,
              endTime: endDate,
            }).catch((error) => ({ sent: false, reason: error instanceof Error ? error.message : String(error) }))
          : { sent: false, reason: "Confirmation disabled." };

        return {
          meetingId: created.meeting.id,
          roomId: roomMeetingId,
          eventId: created.event.id,
          meetingUrl,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          emails: emailResult,
        };
      })
  );

  server.registerTool(
    "calendar.cancel_event",
    {
      title: "Cancel Calendar Event",
      description: "Cancel/delete a calendar event and linked meeting resources after confirmation.",
      inputSchema: {
        eventId: z.string().min(1),
        confirm: z.boolean().default(false),
      },
    },
    async ({ eventId, confirm }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const event = await prisma.calendarEvent.findFirst({ where: { id: eventId, userId: context.userId } });
        if (!event) throw new Error("Event not found for this MCP user.");

        if (!confirm) {
          return {
            preview: true,
            message: "Set confirm=true to cancel/delete this event.",
            event,
          };
        }

        let canceledMeeting = null;
        if (event.meetingId) {
          const meeting = await prisma.meeting.findFirst({
            where: { id: event.meetingId, hostId: context.userId },
          });
          if (meeting) {
            canceledMeeting = await prisma.meeting.update({
              where: { id: meeting.id },
              data: { status: "CANCELED" },
            });
            await deleteLiveKitRoomSafe(meeting.meetingId);

            if (meeting.submitterEmail) {
              await sendMeetingCancellationEmails({
                creatorUserId: context.userId,
                creatorEmail: context.email,
                submitterEmail: meeting.submitterEmail,
                meetingTitle: meeting.title,
                meetingUrl: getPublicMeetingUrl(meeting.meetingId),
                startTime: meeting.startTime,
                endTime: meeting.endTime,
              }).catch(() => undefined);
            }
          }
        }

        await prisma.calendarEvent.delete({ where: { id: event.id } });
        return { deleted: true, eventId: event.id, canceledMeeting };
      })
  );
}

