import { NextRequest, NextResponse } from "next/server";
import { recordReferralVisit, getReferralLinkByCode } from "@/lib/referral";
import { getAppBaseUrl } from "@/lib/app-url";
import crypto from "crypto";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const baseUrl = getAppBaseUrl();

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/`);
  }

  // Get or generate visitor ID
  let visitorId = req.cookies.get("britcrm_visitor_id")?.value;
  let isNewVisitor = false;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    isNewVisitor = true;
  }

  // Extract client metadata
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    null;
  const userAgent = req.headers.get("user-agent") || null;
  const referer = req.headers.get("referer") || null;

  // Record visit
  const result = await recordReferralVisit({
    code,
    visitorId,
    ip,
    userAgent,
    referer,
    landingPath: `/r/${code}`,
  });

  // Determine redirect URL
  let targetPath = result.link?.targetUrl || "/";
  if (!targetPath.startsWith("/")) {
    targetPath = `/${targetPath}`;
  }

  // Preserve search params except internal routing
  const incomingUrl = new URL(req.url);
  const searchParams = new URLSearchParams(incomingUrl.search);
  // Also append ref parameter so client-side forms can also read from query if desired
  searchParams.set("ref", result.link ? result.link.code : code);

  const finalRedirectUrl = new URL(targetPath, baseUrl);
  for (const [key, value] of searchParams.entries()) {
    finalRedirectUrl.searchParams.set(key, value);
  }

  const response = NextResponse.redirect(finalRedirectUrl);

  // Set persistent cookies for attribution
  if (result.success && result.link) {
    response.cookies.set("britcrm_ref", result.link.code, {
      path: "/",
      maxAge: 90 * 24 * 60 * 60, // 90 days attribution window
      sameSite: "lax",
      httpOnly: false, // allow client-side reading for form prefill
    });
  }

  if (isNewVisitor) {
    response.cookies.set("britcrm_visitor_id", visitorId, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: "lax",
      httpOnly: false,
    });
  }

  return response;
}
