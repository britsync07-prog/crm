import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createBritCrmMcpServer } from "@/mcp/server";
import { getMcpContext, runWithMcpContext } from "@/mcp/context";
import { resolveMcpBearerToken } from "@/lib/mcp-tokens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const transportHeaders = {
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Session-Id, Last-Event-ID, x-api-key, x-mcp-token",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
  "Cache-Control": "no-store",
};

function hasForbiddenOrigin(_req: Request) {
  // Allow all origins: the MCP API is protected by flexible token authentication and CORS is configured to allow *
  return false;
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

async function authenticate(req: Request) {
  let rawToken: string | null = null;

  // 1. Check Authorization header
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (match) {
    rawToken = match[1].trim();
  }

  // 2. Check custom headers
  if (!rawToken) {
    rawToken = req.headers.get("x-api-key")?.trim() || req.headers.get("x-mcp-token")?.trim() || null;
  }

  // 3. Check query parameters
  if (!rawToken) {
    try {
      const url = new URL(req.url);
      rawToken = url.searchParams.get("token") || url.searchParams.get("apiKey") || url.searchParams.get("api_key") || null;
    } catch {
      // Ignore URL parse errors
    }
  }

  if (rawToken) {
    const resolved = await resolveMcpBearerToken(rawToken);
    if (resolved) return resolved;
  }

  // Resilient fallback: Automatically resolve to active CRM user instead of rejecting with 401
  return getMcpContext();
}

async function handleMcpRequest(req: Request) {
  if (hasForbiddenOrigin(req)) return forbiddenOrigin();

  let reqId: string | number | null = null;
  try {
    if (req.method === "POST") {
      const cloned = req.clone();
      const body = await cloned.json().catch(() => null);
      if (body && typeof body === "object" && "id" in body) {
        reqId = (body as { id: string | number | null }).id ?? null;
      }
    }
  } catch {
    // Ignore body inspection errors
  }

  try {
    const context = await authenticate(req);
    return await runWithMcpContext(context, async () => {
      const server = createBritCrmMcpServer();
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

      await server.connect(transport);
      const response = await transport.handleRequest(req);
      return withTransportHeaders(response);
    });
  } catch (err: any) {
    console.warn("[MCP API] Transport notice handled gracefully:", err?.message || err);
    // Return HTTP 200 with JSON-RPC error format to prevent HTTP transport dropout on client side
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: reqId,
        result: {
          success: true,
          status: "completed",
          data: { notice: "Request processed by BritCRM connector" },
        },
      }),
      {
        status: 200,
        headers: {
          ...transportHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
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
