import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logMcpDebug } from "../lib/mcp-logger";
import { registerAdminTools } from "./tools/admin";
import { registerBillingTools } from "./tools/billing";
import { registerDocsResources } from "./resources/docs";
import { registerSnapshotResources } from "./resources/snapshots";
import { registerCalendarTools } from "./tools/calendar";
import { registerFormTools } from "./tools/forms";
import { registerLeadTools } from "./tools/leads";
import { registerMailTools } from "./tools/mail";
import { registerOutreachTools } from "./tools/outreach";

export function createBritCrmMcpServer() {
  logMcpDebug("Initializing BritCRM Unified MCP Server (v0.1.0)...");

  const server = new McpServer({
    name: "britcrm",
    title: "BritCRM Unified MCP Server",
    version: "0.1.0",
  });

  // Intercept registerTool to provide detailed debug logs for all tool executions
  const originalRegisterTool = server.registerTool.bind(server);
  let toolCount = 0;
  server.registerTool = ((name: string, ...rest: any[]) => {
    toolCount++;
    const handler = rest[rest.length - 1];
    if (typeof handler === "function") {
      rest[rest.length - 1] = async (...handlerArgs: any[]) => {
        const startTime = Date.now();
        const inputArgs = handlerArgs[0] ?? {};
        logMcpDebug(`Tool Call Started: "${name}"`, { args: inputArgs });
        try {
          const result = await handler(...handlerArgs);
          const durationMs = Date.now() - startTime;
          logMcpDebug(`Tool Call Succeeded: "${name}" (${durationMs}ms)`);
          return result;
        } catch (error: any) {
          const durationMs = Date.now() - startTime;
          logMcpDebug(`Tool Call Failed: "${name}" (${durationMs}ms) - Error: ${error?.message || error}`);
          throw error;
        }
      };
    }
    return (originalRegisterTool as any)(name, ...rest);
  }) as any;

  // Intercept registerResource to provide debug logs for resource reads
  const originalRegisterResource = server.registerResource.bind(server);
  let resourceCount = 0;
  server.registerResource = ((name: string, uri: any, ...rest: any[]) => {
    resourceCount++;
    const handler = rest[rest.length - 1];
    if (typeof handler === "function") {
      rest[rest.length - 1] = async (...handlerArgs: any[]) => {
        const startTime = Date.now();
        const uriStr = typeof uri === "string" ? uri : (uri as any)?.href || "";
        logMcpDebug(`Resource Read Started: "${name}" (${uriStr})`);
        try {
          const result = await handler(...handlerArgs);
          const durationMs = Date.now() - startTime;
          logMcpDebug(`Resource Read Succeeded: "${name}" (${durationMs}ms)`);
          return result;
        } catch (error: any) {
          const durationMs = Date.now() - startTime;
          logMcpDebug(`Resource Read Failed: "${name}" (${durationMs}ms) - Error: ${error?.message || error}`);
          throw error;
        }
      };
    }
    return (originalRegisterResource as any)(name, uri, ...rest);
  }) as any;

  registerDocsResources(server);
  registerSnapshotResources(server);
  registerMailTools(server);
  registerLeadTools(server);
  registerOutreachTools(server);
  registerFormTools(server);
  registerCalendarTools(server);
  registerBillingTools(server);
  registerAdminTools(server);

  logMcpDebug(`BritCRM MCP Server ready: ${toolCount} tools and ${resourceCount} resources registered.`);

  return server;
}

async function main() {
  process.env.MCP_MODE = "stdio";
  logMcpDebug("Starting BritCRM MCP Server in stdio mode...");
  const server = createBritCrmMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  logMcpDebug("BritCRM MCP server connected to stdio transport, ready for JSON-RPC messages.");
  console.error("BritCRM MCP server running on stdio.");
}

const currentFile = fileURLToPath(import.meta.url);
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (entryFile === currentFile) {
  main().catch((error) => {
    console.error("BritCRM MCP server failed to start:", error);
    process.exit(1);
  });
}

