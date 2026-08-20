import { NextRequest, NextResponse } from "next/server";
import { requireInternalOrAdmin } from "@/lib/internal-api-auth";

export async function GET(req: NextRequest) {
  const forbidden = await requireInternalOrAdmin(req);
  if (forbidden) return forbidden;

  return NextResponse.json({ status: "ok", time: new Date().toISOString() });
}
