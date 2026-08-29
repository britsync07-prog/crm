import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createBritCrmMcpServer } from "@/mcp/server";
import { runWithMcpContext } from "@/mcp/context";
import { getAppBaseUrl } from "@/lib/app-url";
import { resolveMcpBearerToken } from "@/lib/mcp-tokens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const transportHeaders = {
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
  "Cache-Control": "no-store",
};

function getAllowedOrigins() {
  const values = [getAppBaseUrl(), process.env.NEXT_PUBLIC_APP_URL, process.env.NEXTAUTH_URL, process.env.APP_URL];
  const origins = new Set<string>();

  for (const value of values) {
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // Ignore invalid optional deployment URLs.
    }
  }

  return origins;
}

function hasForbiddenOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return !getAllowedOrigins().has(origin);
}

function withTransportHeaders(response: Response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(transportHeaders)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function forbiddenOrigin() {
  return new Response(JSON.stringify({ error: "Forbidden MCP origin." }), {
    status: 403,
    headers: {
      ...transportHeaders,
      "Content-Type": "application/json",
    },
  });
}

function unauthorized() {
  const baseUrl = getAppBaseUrl();
  return new Response(JSON.stringify({ error: "Unauthorized MCP token." }), {
    status: 401,
    headers: {
      ...transportHeaders,
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer realm="BritCRM MCP", resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`,
    },
  });
}

async function authenticate(req: Request) {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return resolveMcpBearerToken(match[1].trim());
}

async function handleMcpRequest(req: Request) {
  if (hasForbiddenOrigin(req)) return forbiddenOrigin();

  const context = await authenticate(req);
  if (!context) return unauthorized();

  return runWithMcpContext(context, async () => {
    const server = createBritCrmMcpServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    return withTransportHeaders(await transport.handleRequest(req));
  });
}

export async function GET(req: Request) {
  return handleMcpRequest(req);
}

export async function POST(req: Request) {
  return handleMcpRequest(req);
}

export async function DELETE(req: Request) {
  return handleMcpRequest(req);
}

export async function OPTIONS(req: Request) {
  if (hasForbiddenOrigin(req)) return forbiddenOrigin();

  return new Response(null, {
    status: 204,
    headers: transportHeaders,
  });
}
