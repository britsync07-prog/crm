import { NextRequest, NextResponse } from "next/server";
import { processCalendarReminders } from "@/lib/reminder-worker";
import { requireInternalOrAdmin } from "@/lib/internal-api-auth";

// In a real production app, this would be a CRON job.
// For now, we provide a manual trigger or a lazy-ping endpoint.
export async function GET(req: NextRequest) {
  const forbidden = await requireInternalOrAdmin(req);
  if (forbidden) return forbidden;

  try {
    await processCalendarReminders();
    return NextResponse.json({ success: true, processedAt: new Date().toISOString() });
  } catch (error) {
    console.error("GET /api/calendar/reminders/trigger error:", error);
    return NextResponse.json({ error: "Failed to process reminders." }, { status: 500 });
  }
}
