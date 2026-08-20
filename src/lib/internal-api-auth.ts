import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function requireInternalOrAdmin(req: NextRequest) {
  const configuredSecret = process.env.INTERNAL_CRON_SECRET?.trim();
  const providedSecret = req.headers.get("x-internal-cron-secret")?.trim();

  if (configuredSecret && providedSecret === configuredSecret) {
    return null;
  }

  const session = await getSession(req);
  if (session?.role === "ADMIN") {
    return null;
  }

  if (process.env.NODE_ENV !== "production" && !configuredSecret) {
    return null;
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
