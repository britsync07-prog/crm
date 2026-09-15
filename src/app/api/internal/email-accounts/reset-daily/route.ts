import { NextResponse } from "next/server";
import { syncAllEmailAccountsDailyLimits } from "@/lib/email-account";

export async function GET() {
  try {
    await syncAllEmailAccountsDailyLimits();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to reset daily limits" }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
