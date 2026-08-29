import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOAuthClient } from "@/lib/oauth-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // 1. Identify which user to associate with this registration
  let userId: string | null = null;
  const session = await getSession();
  if (session?.id) {
    userId = session.id;
  } else {
    // If external dynamic registration without active browser session, find the first active admin/user
    const defaultUser = await prisma.user.findFirst({
      where: { status: "ACTIVE" },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    userId = defaultUser?.id || null;
  }

  if (!userId) {
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "No active CRM user available to register client.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }

  const clientName = body.client_name || "Gemini Connected App";
  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris : ["https://gemini.google.com/oauth/callback"];
  const grantTypes = Array.isArray(body.grant_types) ? body.grant_types : ["authorization_code", "refresh_token", "client_credentials"];
  const scopes = Array.isArray(body.scopes) ? body.scopes : ["mcp", "crm", "read", "write"];

  try {
    const client = await createOAuthClient({
      userId,
      name: clientName,
      redirectUris,
      grantTypes,
      scopes,
      isConfidential: true,
    });

    const nowSeconds = Math.floor(Date.now() / 1000);

    return NextResponse.json(
      {
        client_id: client.clientId,
        client_secret: client.clientSecret,
        client_id_issued_at: nowSeconds,
        client_secret_expires_at: 0,
        client_name: client.name,
        redirect_uris: client.redirectUris,
        grant_types: client.grantTypes,
        response_types: client.responseTypes,
        token_endpoint_auth_method: "client_secret_post",
      },
      {
        status: 201,
        headers: corsHeaders,
      },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "invalid_client_metadata",
        error_description: err instanceof Error ? err.message : "Failed to register dynamic client.",
      },
      {
        status: 400,
        headers: corsHeaders,
      },
    );
  }
}
