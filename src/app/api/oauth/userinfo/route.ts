import { NextResponse } from "next/server";
import { resolveOAuthAccessToken } from "@/lib/oauth-store";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return NextResponse.json(
      { error: "unauthorized", error_description: "Missing or invalid Bearer token." },
      { status: 401, headers: corsHeaders },
    );
  }

  const token = match[1].trim();
  const context = await resolveOAuthAccessToken(token);
  if (!context) {
    return NextResponse.json(
      { error: "invalid_token", error_description: "Access token is expired or invalid." },
      { status: 401, headers: corsHeaders },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: context.userId },
    select: { id: true, name: true, email: true, role: true, image: true },
  });

  return NextResponse.json(
    {
      sub: context.userId,
      name: user?.name || "BritCRM User",
      email: context.email,
      role: context.role,
      picture: user?.image || null,
    },
    {
      headers: corsHeaders,
    },
  );
}

export async function POST(req: Request) {
  return GET(req);
}
