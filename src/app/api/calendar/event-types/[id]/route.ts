import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.eventType.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existing || existing.userId !== session.id) {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 });
    }

    const body = await req.json();
    const { 
      title, 
      slug, 
      duration, 
      color, 
      locationType, 
      locationDetails, 
      description, 
      isActive, 
      bufferBefore, 
      bufferAfter 
    } = body;

    const data: any = {};
    if (typeof title === "string" && title.trim()) data.title = title.trim();
    if (typeof duration === "number" && duration > 0) data.duration = duration;
    if (typeof color === "string") data.color = color;
    if (typeof locationType === "string") data.locationType = locationType;
    if (locationDetails !== undefined) data.locationDetails = locationDetails;
    if (description !== undefined) data.description = description;
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (typeof bufferBefore === "number") data.bufferBefore = bufferBefore;
    if (typeof bufferAfter === "number") data.bufferAfter = bufferAfter;

    if (slug && typeof slug === "string") {
      const sanitized = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (sanitized) {
        const conflict = await prisma.eventType.findUnique({
          where: { userId_slug: { userId: session.id, slug: sanitized } },
        });
        if (!conflict || conflict.id === id) {
          data.slug = sanitized;
        }
      }
    }

    const updated = await prisma.eventType.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.eventType.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existing || existing.userId !== session.id) {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 });
    }

    await prisma.eventType.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
