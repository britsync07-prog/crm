import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const baseUrl = getAppBaseUrl();
  const searchParams = req.nextUrl.searchParams;
  const targetUrl = new URL(`${baseUrl}/oauth/authorize`);
  searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(targetUrl.toString());
}
