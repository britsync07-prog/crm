import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_EVENT_TEMPLATES = [
  {
    title: "15 Min Discovery Call",
    slug: "15min",
    duration: 15,
    color: "#006bff",
    locationType: "VIDEO",
    description: "A quick introductory call to discuss your goals and answer preliminary questions.",
  },
  {
    title: "30 Min Consultation",
    slug: "30min",
    duration: 30,
    color: "#8247e5",
    locationType: "VIDEO",
    description: "Detailed consultation covering solution architecture, timeline, and strategy.",
  },
  {
    title: "60 Min Strategy Session",
    slug: "60min",
    duration: 60,
    color: "#00a35c",
    locationType: "VIDEO",
    description: "Full in-depth strategy review and operational roadmap planning.",
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let eventTypes = await prisma.eventType.findMany({
      where: { userId: session.id },
      orderBy: { duration: "asc" },
    });

    // Auto-seed default event types if user doesn't have any yet
    if (eventTypes.length === 0) {
      await Promise.all(
        DEFAULT_EVENT_TEMPLATES.map((tmpl) =>
          prisma.eventType.create({
            data: {
              ...tmpl,
              userId: session.id,
            },
          })
        )
      );

      eventTypes = await prisma.eventType.findMany({
        where: { userId: session.id },
        orderBy: { duration: "asc" },
      });
    }

    return NextResponse.json(eventTypes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, slug, duration, color, locationType, locationDetails, description, bufferBefore, bufferAfter } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const baseSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "meeting";
    let finalSlug = baseSlug;
    let counter = 1;

    while (await prisma.eventType.findUnique({ where: { userId_slug: { userId: session.id, slug: finalSlug } } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const created = await prisma.eventType.create({
      data: {
        userId: session.id,
        title: title.trim(),
        slug: finalSlug,
        duration: Number(duration) || 30,
        color: color || "#006bff",
        locationType: locationType || "VIDEO",
        locationDetails: locationDetails || null,
        description: description || null,
        bufferBefore: Number(bufferBefore) || 0,
        bufferAfter: Number(bufferAfter) || 0,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
