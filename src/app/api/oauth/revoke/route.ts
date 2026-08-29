import { NextResponse } from "next/server";
import { revokeOAuthToken } from "@/lib/oauth-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  let token: string | null = null;
  const contentType = req.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const body = await req.json();
      token = body.token || null;
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      token = params.get("token");
    }
  } catch {
    // Ignore parse error
  }

  if (token) {
    await revokeOAuthToken(token);
  }

  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
