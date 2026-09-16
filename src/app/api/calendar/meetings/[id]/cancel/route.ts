import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteLiveKitRoomSafe, getPublicMeetingUrl, sendMeetingCancellationEmails } from "@/lib/form-meeting";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: { host: { select: { id: true, email: true } } },
    });

    if (!meeting || meeting.hostId !== session.id) {
      return NextResponse.json({ error: "Meeting not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = body?.reason || "Canceled by host";

    await prisma.$transaction([
      prisma.meeting.update({
        where: { id: meeting.id },
        data: { status: "CANCELED" },
      }),
      prisma.calendarEvent.deleteMany({
        where: { meetingId: meeting.id },
      }),
    ]);

    await deleteLiveKitRoomSafe(meeting.meetingId);

    if (meeting.submitterEmail) {
      const meetingUrl = getPublicMeetingUrl(meeting.meetingId, req);
      await sendMeetingCancellationEmails({
        creatorUserId: meeting.host.id,
        creatorEmail: meeting.host.email,
        submitterEmail: meeting.submitterEmail,
        meetingTitle: meeting.title,
        meetingUrl,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
      }).catch((err) => console.error("[CancelMeeting] Failed to send cancellation email:", err));
    }

    return NextResponse.json({ success: true, reason });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
