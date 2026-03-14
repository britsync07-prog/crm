import { NextResponse } from "next/server";
import { processCalendarReminders } from "@/lib/reminder-worker";

export async function GET() {
  try {
    await processCalendarReminders();
    return NextResponse.json({ success: true, processedAt: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to process reminders." }, { status: 500 });
  }
}
