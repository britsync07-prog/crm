import { NextRequest, NextResponse } from "next/server";
import { runOutreachReplySync } from "@/lib/outreach-reply-worker";
import { requireInternalOrAdmin } from "@/lib/internal-api-auth";

export async function GET(req: NextRequest) {
  const forbidden = await requireInternalOrAdmin(req);
  if (forbidden) return forbidden;

  try {
    const result = await runOutreachReplySync();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("GET /api/internal/outreach-replies error:", error);
    return NextResponse.json({ ok: false, error: "Failed to run outreach reply sync." }, { status: 500 });
  }
}
