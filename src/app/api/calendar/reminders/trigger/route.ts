import { NextRequest, NextResponse } from "next/server";
import { processCalendarReminders } from "@/lib/reminder-worker";

// In a real production app, this would be a CRON job.
// For now, we provide a manual trigger or a lazy-ping endpoint.
export async function GET(req: NextRequest) {
  try {
    await processCalendarReminders();
    return NextResponse.json({ success: true, processedAt: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
