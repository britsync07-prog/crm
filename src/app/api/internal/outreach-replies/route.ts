import { NextResponse } from "next/server";
import { runOutreachReplySync } from "@/lib/outreach-reply-worker";

export async function GET() {
  try {
    const result = await runOutreachReplySync();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to run outreach reply sync." }, { status: 500 });
  }
}
