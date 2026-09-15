import { NextRequest, NextResponse } from "next/server";
import { syncAllEmailAccountsDailyLimits } from "@/lib/email-account";
import { requireInternalOrAdmin } from "@/lib/internal-api-auth";

export async function GET(req: NextRequest) {
  const forbidden = await requireInternalOrAdmin(req);
  if (forbidden) return forbidden;

  try {
    const accounts = await syncAllEmailAccountsDailyLimits();
    return NextResponse.json({
      success: true,
      count: accounts.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET /api/internal/email-accounts/reset-daily error:", error);
    return NextResponse.json({ error: "Failed to reset daily email accounts." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
