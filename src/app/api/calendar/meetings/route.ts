import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPublicMeetingUrl } from "@/lib/form-meeting";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get("status")?.toLowerCase() || "upcoming";
    const now = new Date();

    const whereClause: any = { hostId: session.id };

    if (filterStatus === "upcoming") {
      whereClause.status = "ACTIVE";
      whereClause.endTime = { gte: now };
    } else if (filterStatus === "past") {
      whereClause.OR = [
        { status: "ENDED" },
        { status: "ACTIVE", endTime: { lt: now } }
      ];
    } else if (filterStatus === "canceled") {
      whereClause.status = "CANCELED";
    }

    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      orderBy: { startTime: filterStatus === "past" ? "desc" : "asc" },
      take: 100,
    });

    const meetingIds = meetings.map((m) => m.id);
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: {
        userId: session.id,
        meetingId: { in: meetingIds },
      },
    });

    const eventByMeetingId = new Map(calendarEvents.map((e) => [e.meetingId, e]));

    const formatted = meetings.map((m) => {
      const calEvent = eventByMeetingId.get(m.id);
      let parsedMeta: any = {};
      try {
        if (calEvent?.externalMeta) parsedMeta = JSON.parse(calEvent.externalMeta);
        else if (m.metadata) parsedMeta = JSON.parse(m.metadata);
      } catch {}

      const meetingUrl = parsedMeta.meetingUrl || getPublicMeetingUrl(m.meetingId, req);

      return {
        id: m.id,
        meetingId: m.meetingId,
        title: m.title,
        status: m.status,
        startTime: m.startTime.toISOString(),
        endTime: m.endTime.toISOString(),
        submitterEmail: m.submitterEmail || parsedMeta.submitterEmail || "Guest",
        submitterName: parsedMeta.submitterName || parsedMeta.name || null,
        guests: parsedMeta.guests || null,
        notes: parsedMeta.notes || calEvent?.description || null,
        meetingUrl,
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
