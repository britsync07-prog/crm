import { NextResponse } from "next/server";
import {
  exchangeOAuthAuthCode,
  refreshOAuthToken,
  createClientCredentialsToken,
  validateOAuthClient,
} from "@/lib/oauth-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
  "Cache-Control": "no-store",
  Pragma: "no-cache",
};

function oauthError(error: string, description: string, status = 400) {
  return NextResponse.json(
    {
      error,
      error_description: description,
    },
    {
      status,
      headers: corsHeaders,
    },
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  let clientId: string | null = null;
  let clientSecret: string | null = null;
  let grantType: string | null = null;
  let code: string | null = null;
  let redirectUri: string | null = null;
  let codeVerifier: string | null = null;
  let refreshToken: string | null = null;
  let scope: string | null = null;

  // 1. Check HTTP Basic Authentication header (client_id:client_secret)
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("basic ")) {
    try {
      const credentials = Buffer.from(authHeader.slice(6).trim(), "base64").toString("utf-8");
      const colonIndex = credentials.indexOf(":");
      if (colonIndex !== -1) {
        clientId = decodeURIComponent(credentials.substring(0, colonIndex));
        clientSecret = decodeURIComponent(credentials.substring(colonIndex + 1));
      }
    } catch {
      // Ignore header decode errors, fallback to body
    }
  }

  // 2. Parse request body (JSON or Form URL Encoded)
  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const json = await req.json();
      clientId = clientId || json.client_id || null;
      clientSecret = clientSecret || json.client_secret || null;
      grantType = json.grant_type || null;
      code = json.code || null;
      redirectUri = json.redirect_uri || null;
      codeVerifier = json.code_verifier || null;
      refreshToken = json.refresh_token || null;
      scope = json.scope || null;
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      clientId = clientId || params.get("client_id");
      clientSecret = clientSecret || params.get("client_secret");
      grantType = params.get("grant_type");
      code = params.get("code");
      redirectUri = params.get("redirect_uri");
      codeVerifier = params.get("code_verifier");
      refreshToken = params.get("refresh_token");
      scope = params.get("scope");
    }
  } catch (err) {
    return oauthError("invalid_request", "Failed to parse request body.");
  }

  if (!grantType) {
    return oauthError("invalid_request", "Missing grant_type parameter.");
  }

  // Handle authorization_code grant
  if (grantType === "authorization_code") {
    if (!code) {
      return oauthError("invalid_request", "Missing code parameter.");
    }
    if (!clientId) {
      return oauthError("invalid_client", "Missing client_id parameter.");
    }

    try {
      const tokenResult = await exchangeOAuthAuthCode({
        code,
        clientId,
        clientSecret,
        codeVerifier,
        redirectUri,
      });

      return NextResponse.json(
        {
          access_token: tokenResult.accessToken,
          token_type: tokenResult.tokenType,
          expires_in: tokenResult.expiresIn,
          refresh_token: tokenResult.refreshToken,
          scope: tokenResult.scope,
        },
        {
          headers: corsHeaders,
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to exchange authorization code.";
      return oauthError("invalid_grant", message);
    }
  }

  // Handle refresh_token grant
  if (grantType === "refresh_token") {
    if (!refreshToken) {
      return oauthError("invalid_request", "Missing refresh_token parameter.");
    }

    try {
      const tokenResult = await refreshOAuthToken({
        refreshToken,
        clientId,
        clientSecret,
      });

      return NextResponse.json(
        {
          access_token: tokenResult.accessToken,
          token_type: tokenResult.tokenType,
          expires_in: tokenResult.expiresIn,
          refresh_token: tokenResult.refreshToken,
          scope: tokenResult.scope,
        },
        {
          headers: corsHeaders,
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refresh token.";
      return oauthError("invalid_grant", message);
    }
  }

  // Handle client_credentials grant
  if (grantType === "client_credentials") {
    if (!clientId || !clientSecret) {
      return oauthError("invalid_client", "Missing client credentials.");
    }

    try {
      const tokenResult = await createClientCredentialsToken({
        clientId,
        clientSecret,
        scope,
      });

      return NextResponse.json(
        {
          access_token: tokenResult.accessToken,
          token_type: tokenResult.tokenType,
          expires_in: tokenResult.expiresIn,
          scope: tokenResult.scope,
        },
        {
          headers: corsHeaders,
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid client credentials.";
      return oauthError("invalid_client", message);
    }
  }

  return oauthError("unsupported_grant_type", `Grant type '${grantType}' is not supported.`);
}
