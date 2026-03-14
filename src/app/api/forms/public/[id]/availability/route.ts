import { NextRequest, NextResponse } from "next/server";
import { getFormAvailability } from "@/lib/form-meeting";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Missing date query param (YYYY-MM-DD)" }, { status: 400 });
    }

    const form = await prisma.form.findUnique({
      where: { id },
      select: { id: true, meetingSchedulingEnabled: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!form.meetingSchedulingEnabled) {
      return NextResponse.json({ error: "Meeting scheduling is disabled for this form" }, { status: 400 });
    }

    const availability = await getFormAvailability(id, date);
    return NextResponse.json(availability);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load availability";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
