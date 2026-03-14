import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await prisma.calendarSettings.findUnique({
      where: { userId: session.id },
    });

    return NextResponse.json(settings || {
      availableStart: "09:00",
      availableEnd: "17:00",
      timeZone: "UTC",
      reminderAccountId: null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { availableStart, availableEnd, timeZone, reminderAccountId } = body;

    const settings = await prisma.calendarSettings.upsert({
      where: { userId: session.id },
      update: {
        availableStart,
        availableEnd,
        timeZone,
        reminderAccountId
      },
      create: {
        userId: session.id,
        availableStart,
        availableEnd,
        timeZone,
        reminderAccountId
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
