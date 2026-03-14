import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: session.id,
        ...(start && end ? {
          start: { lt: new Date(end) },
          end: { gt: new Date(start) }
        } : {})
      },
      orderBy: { start: "asc" }
    });

    return NextResponse.json(events);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, description, start, end } = body;

    if (!title || !start || !end) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId: session.id,
        title,
        description,
        start: new Date(start),
        end: new Date(end)
      }
    });

    return NextResponse.json(event);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
