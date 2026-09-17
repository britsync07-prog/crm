import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, email: true, image: true },
    });

    const settings = await prisma.calendarSettings.findUnique({
      where: { userId: session.id },
    });

    const effectiveSlug = settings?.bookingSlug || user?.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || user?.email.split("@")[0] || user?.id;

    return NextResponse.json(
      {
        ...(settings || {
          availableStart: "09:00",
          availableEnd: "17:00",
          timeZone: "UTC",
          reminderAccountId: null,
          weeklySchedule: null,
          bufferMinutes: 0,
          noticeHours: 2,
          bookingWindowDays: 60,
          bookingSlug: null,
        }),
        user: {
          id: user?.id,
          name: user?.name || "Host",
          email: user?.email,
          image: user?.image,
          bookingSlug: effectiveSlug,
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { 
      availableStart, 
      availableEnd, 
      timeZone, 
      reminderAccountId,
      weeklySchedule,
      bufferMinutes,
      noticeHours,
      bookingWindowDays,
      bookingSlug
    } = body;

    const sanitizedSlug = bookingSlug ? String(bookingSlug).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") : null;

    const settings = await prisma.calendarSettings.upsert({
      where: { userId: session.id },
      update: {
        availableStart,
        availableEnd,
        timeZone,
        reminderAccountId,
        weeklySchedule: typeof weeklySchedule === "string" ? weeklySchedule : weeklySchedule ? JSON.stringify(weeklySchedule) : null,
        bufferMinutes: Number.isFinite(Number(bufferMinutes)) ? Number(bufferMinutes) : 0,
        noticeHours: Number.isFinite(Number(noticeHours)) ? Number(noticeHours) : 2,
        bookingWindowDays: Number.isFinite(Number(bookingWindowDays)) ? Number(bookingWindowDays) : 60,
        bookingSlug: sanitizedSlug,
      },
      create: {
        userId: session.id,
        availableStart: availableStart || "09:00",
        availableEnd: availableEnd || "17:00",
        timeZone: timeZone || "UTC",
        reminderAccountId,
        weeklySchedule: typeof weeklySchedule === "string" ? weeklySchedule : weeklySchedule ? JSON.stringify(weeklySchedule) : null,
        bufferMinutes: Number.isFinite(Number(bufferMinutes)) ? Number(bufferMinutes) : 0,
        noticeHours: Number.isFinite(Number(noticeHours)) ? Number(noticeHours) : 2,
        bookingWindowDays: Number.isFinite(Number(bookingWindowDays)) ? Number(bookingWindowDays) : 60,
        bookingSlug: sanitizedSlug,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
