import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
  const server = new McpServer({
    name: "britcrm",
    title: "BritCRM Unified MCP Server",
    version: "0.1.0",
  });

  registerDocsResources(server);
  registerSnapshotResources(server);
  registerMailTools(server);
  registerLeadTools(server);
  registerOutreachTools(server);
  registerFormTools(server);
  registerCalendarTools(server);
  registerBillingTools(server);
  registerAdminTools(server);

  return server;
}

async function main() {
  const server = createBritCrmMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
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
