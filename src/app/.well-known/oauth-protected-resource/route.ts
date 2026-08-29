import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Cache-Control": "public, max-age=3600",
};

export async function GET() {
  const baseUrl = getAppBaseUrl();
  return NextResponse.json(
    {
      resource: `${baseUrl}/api/mcp`,
      authorization_servers: [baseUrl],
      scopes_supported: ["mcp", "crm", "read", "write", "offline_access"],
      bearer_methods_supported: ["header"],
      resource_name: "BritCRM MCP Server",
      resource_documentation: `${baseUrl}/settings/mcp`,
    },
    {
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
