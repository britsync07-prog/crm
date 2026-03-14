import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  deleteLiveKitRoomSafe,
  getPublicMeetingUrl,
  sendMeetingCancellationEmails,
} from "@/lib/form-meeting";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, userId: session.id },
      select: { id: true, isLocked: true },
    });

    if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    if (existing.isLocked) {
      return NextResponse.json({ error: "This meeting is locked and cannot be moved" }, { status: 403 });
    }

    const body = await req.json();
    const { start, end } = body;

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(start ? { start: new Date(start) } : {}),
        ...(end ? { end: new Date(end) } : {}),
        reminderSent: false,
      },
    });

    return NextResponse.json(event);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const event = await prisma.calendarEvent.findFirst({
      where: { id, userId: session.id },
    });

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    if (event.source === "FORM_MEETING" && event.meetingId) {
      const meeting = await prisma.meeting.findUnique({
        where: { id: event.meetingId },
        include: {
          host: {
            select: { id: true, email: true },
          },
        },
      });

      if (meeting && meeting.hostId === session.id) {
        await prisma.meeting.update({
          where: { id: meeting.id },
          data: { status: "CANCELED" },
        });

        await deleteLiveKitRoomSafe(meeting.meetingId);

        if (meeting.submitterEmail) {
          const meetingUrl = getPublicMeetingUrl(meeting.meetingId, new URL(req.url).origin);
          await sendMeetingCancellationEmails({
            creatorUserId: meeting.host.id,
            creatorEmail: meeting.host.email,
            submitterEmail: meeting.submitterEmail,
            meetingTitle: meeting.title,
            meetingUrl,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
          }).catch(() => undefined);
        }
      }
    }

    await prisma.calendarEvent.delete({ where: { id: event.id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
