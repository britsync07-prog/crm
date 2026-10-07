import { NextRequest, NextResponse } from "next/server";
import { recordReferralVisit } from "@/lib/referral";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = (body.code || "").trim();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    let visitorId = req.cookies.get("britcrm_visitor_id")?.value;
    let isNewVisitor = false;
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      isNewVisitor = true;
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      null;
    const userAgent = req.headers.get("user-agent") || null;
    const referer = req.headers.get("referer") || null;

    const result = await recordReferralVisit({
      code,
      visitorId,
      ip,
      userAgent,
      referer,
      landingPath: body.landingPath || "/",
    });

    if (!result.success || !result.link) {
      return NextResponse.json({ success: false, message: "Invalid or inactive referral code" });
    }

    const response = NextResponse.json({
      success: true,
      agencyName: result.link.agencyName,
      code: result.link.code,
    });

    response.cookies.set("britcrm_ref", result.link.code, {
      path: "/",
      maxAge: 90 * 24 * 60 * 60,
      sameSite: "lax",
      httpOnly: false,
    });

    if (isNewVisitor) {
      response.cookies.set("britcrm_visitor_id", visitorId, {
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
        httpOnly: false,
      });
    }

    return response;
  } catch (err) {
    console.error("[Referral Track API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
