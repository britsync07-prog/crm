import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getReferralLinkDetails } from "@/lib/referral";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing link ID" }, { status: 400 });
  }

  const details = await getReferralLinkDetails(id);
  if (!details.link) {
    return NextResponse.json({ error: "Referral link not found" }, { status: 404 });
  }

  return NextResponse.json(details);
}
