import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createBritCrmMcpServer } from "@/mcp/server";
import { runWithMcpContext } from "@/mcp/context";
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

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized MCP token." }), {
    status: 401,
    headers: {
      ...transportHeaders,
      "Content-Type": "application/json",
      "WWW-Authenticate": 'Bearer realm="BritCRM MCP"',
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

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: transportHeaders,
  });
}
