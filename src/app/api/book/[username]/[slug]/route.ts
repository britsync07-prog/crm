import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { 
  createLiveKitRoomForMeeting, 
  getPublicMeetingUrl, 
  makeMeetingRoomId, 
  sendMeetingConfirmationEmails 
} from "@/lib/form-meeting";

// Helper: resolve host user by username slug, email prefix, or user id
async function resolveHostUser(username: string) {
  const normalized = username.toLowerCase().trim();

  // 1. Check custom bookingSlug in calendarSettings
  const settingsMatch = await prisma.calendarSettings.findFirst({
    where: { bookingSlug: normalized },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });
  if (settingsMatch?.user) {
    return { user: settingsMatch.user, settings: settingsMatch };
  }

  // 2. Check user id directly
  const userById = await prisma.user.findUnique({
    where: { id: username },
    select: { id: true, name: true, email: true, image: true },
  });
  if (userById) {
    const settings = await prisma.calendarSettings.findUnique({ where: { userId: userById.id } });
    return { user: userById, settings };
  }

  // 3. Check by user email prefix or name slug
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, image: true },
  });

  const matched = allUsers.find((u) => {
    const emailPrefix = u.email.split("@")[0].toLowerCase();
    const nameSlug = u.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return emailPrefix === normalized || nameSlug === normalized;
  });

  if (matched) {
    const settings = await prisma.calendarSettings.findUnique({ where: { userId: matched.id } });
    return { user: matched, settings };
  }

  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  try {
    const { username, slug } = await params;
    const resolved = await resolveHostUser(username);

    if (!resolved) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 });
    }

    const { user, settings } = resolved;

    const eventType = await prisma.eventType.findUnique({
      where: { userId_slug: { userId: user.id, slug: slug.toLowerCase() } },
    });

    if (!eventType || !eventType.isActive) {
      return NextResponse.json({ error: "Event type not found or inactive" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    if (!dateStr) {
      // Just return event type and host details
      return NextResponse.json({
        host: {
          id: user.id,
          name: user.name || "Host",
          email: user.email,
          image: user.image,
          timeZone: settings?.timeZone || "UTC",
        },
        eventType: {
          id: eventType.id,
          title: eventType.title,
          slug: eventType.slug,
          description: eventType.description,
          duration: eventType.duration,
          color: eventType.color,
          locationType: eventType.locationType,
        },
      });
    }

    const day = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(day.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    // Check weekly schedule if configured
    const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, etc.
    let isDayActive = true;
    let dayStart = settings?.availableStart || "09:00";
    let dayEnd = settings?.availableEnd || "17:00";

    if (settings?.weeklySchedule) {
      try {
        const schedule = JSON.parse(settings.weeklySchedule);
        const dayConfig = schedule[String(dayOfWeek)] || schedule[dayOfWeek];
        if (dayConfig) {
          isDayActive = !!dayConfig.active;
          if (dayConfig.start) dayStart = dayConfig.start;
          if (dayConfig.end) dayEnd = dayConfig.end;
        }
      } catch {}
    } else {
      // Default: Mon-Fri active, Sat-Sun off
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        isDayActive = false;
      }
    }

    if (!isDayActive) {
      return NextResponse.json({
        host: { id: user.id, name: user.name, timeZone: settings?.timeZone || "UTC" },
        eventType,
        slots: [],
      });
    }

    // Parse start and end hours
    const [sh, sm] = dayStart.split(":").map(Number);
    const [eh, em] = dayEnd.split(":").map(Number);

    const rangeStart = new Date(day);
    rangeStart.setHours(sh || 9, sm || 0, 0, 0);

    const rangeEnd = new Date(day);
    rangeEnd.setHours(eh || 17, em || 0, 0, 0);

    const now = new Date();
    const noticeHours = settings?.noticeHours ?? 2;
    const minNoticeTime = new Date(now.getTime() + noticeHours * 60 * 60 * 1000);

    // Get existing conflicts
    const conflicts = await prisma.calendarEvent.findMany({
      where: {
        userId: user.id,
        start: { lt: rangeEnd },
        end: { gt: rangeStart },
      },
      select: { start: true, end: true },
    });

    const durationMin = eventType.duration;
    const bufferBefore = eventType.bufferBefore || settings?.bufferMinutes || 0;
    const bufferAfter = eventType.bufferAfter || settings?.bufferMinutes || 0;

    const slots: Array<{ start: string; end: string; time: string }> = [];
    const cursor = new Date(rangeStart);

    while (cursor < rangeEnd) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

      if (slotEnd > rangeEnd) break;

      // Slot is invalid if in the past or violates minimum notice
      const isTooSoon = slotStart <= minNoticeTime;

      // Check conflict including buffer times
      const bufferedStart = new Date(slotStart.getTime() - bufferBefore * 60000);
      const bufferedEnd = new Date(slotEnd.getTime() + bufferAfter * 60000);

      const hasConflict = conflicts.some((c) => bufferedStart < c.end && bufferedEnd > c.start);

      if (!isTooSoon && !hasConflict) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          time: slotStart.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }),
        });
      }

      // Increment cursor (by duration or 30 min intervals)
      const step = durationMin <= 30 ? durationMin : 30;
      cursor.setMinutes(cursor.getMinutes() + step);
    }

    return NextResponse.json({
      host: {
        id: user.id,
        name: user.name || "Host",
        email: user.email,
        image: user.image,
        timeZone: settings?.timeZone || "UTC",
      },
      eventType,
      slots,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  try {
    const { username, slug } = await params;
    const resolved = await resolveHostUser(username);

    if (!resolved) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 });
    }

    const { user, settings } = resolved;

    const eventType = await prisma.eventType.findUnique({
      where: { userId_slug: { userId: user.id, slug: slug.toLowerCase() } },
    });

    if (!eventType || !eventType.isActive) {
      return NextResponse.json({ error: "Event type not found or inactive" }, { status: 404 });
    }

    const body = await req.json();
    const { slotStart, name, email, guests, notes } = body;

    if (!slotStart || !name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name, email and time slot are required" }, { status: 400 });
    }

    const start = new Date(slotStart);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid slot time" }, { status: 400 });
    }

    const end = new Date(start.getTime() + eventType.duration * 60000);

    // Double-check real-time slot conflict
    const conflict = await prisma.calendarEvent.findFirst({
      where: {
        userId: user.id,
        start: { lt: end },
        end: { gt: start },
      },
    });

    if (conflict) {
      return NextResponse.json({ error: "This time slot is no longer available. Please pick another." }, { status: 409 });
    }

    // Generate room id and meeting title
    const roomMeetingId = makeMeetingRoomId();
    const meetingTitle = `${name.trim()} and ${user.name || "Host"}: ${eventType.title}`;

    // Create LiveKit video room if locationType is VIDEO
    if (eventType.locationType === "VIDEO") {
      try {
        await createLiveKitRoomForMeeting(roomMeetingId, end);
      } catch (err: any) {
        console.warn("[LiveKit] Meeting room pre-creation warning:", err?.message || err);
      }
    }

    const meetingUrl = getPublicMeetingUrl(roomMeetingId, req);

    // Create database records
    const meeting = await prisma.meeting.create({
      data: {
        meetingId: roomMeetingId,
        hostId: user.id,
        title: meetingTitle,
        status: "ACTIVE",
        startTime: start,
        endTime: end,
        submitterEmail: email.trim().toLowerCase(),
        metadata: JSON.stringify({
          eventTypeId: eventType.id,
          eventTypeTitle: eventType.title,
          meetingUrl,
          submitterName: name.trim(),
          submitterEmail: email.trim().toLowerCase(),
          guests: guests || null,
          notes: notes || null,
        }),
      },
    });

    await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: meetingTitle,
        description: notes ? `Notes: ${notes}` : `Booked via ${eventType.title}`,
        start,
        end,
        source: "CALENDLY_BOOKING",
        meetingId: meeting.id,
        externalMeta: JSON.stringify({
          meetingUrl,
          submitterName: name.trim(),
          submitterEmail: email.trim().toLowerCase(),
          guests: guests || null,
          notes: notes || null,
          eventTypeId: eventType.id,
        }),
      },
    });

    // Send confirmation emails
    sendMeetingConfirmationEmails({
      creatorUserId: user.id,
      creatorEmail: user.email,
      submitterEmail: email.trim().toLowerCase(),
      meetingTitle,
      meetingUrl,
      startTime: start,
      endTime: end,
    }).catch((err) => console.error("[Booking] Confirmation email failed:", err));

    // Upsert Lead in CRM
    await prisma.lead.upsert({
      where: { email: email.trim().toLowerCase() },
      update: {
        status: "Meeting Booked",
      },
      create: {
        userId: user.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        status: "Meeting Booked",
        source: `Calendly: ${eventType.title}`,
      },
    }).catch((err) => console.error("[Booking] Lead sync failed:", err));

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        meetingId: roomMeetingId,
        title: meetingTitle,
        start: start.toISOString(),
        end: end.toISOString(),
        meetingUrl,
        hostName: user.name || "Host",
        hostEmail: user.email,
        duration: eventType.duration,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
