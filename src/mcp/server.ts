import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAdminTools } from "./tools/admin.js";
import { registerBillingTools } from "./tools/billing.js";
import { registerDocsResources } from "./resources/docs.js";
import { registerCalendarTools } from "./tools/calendar.js";
import { registerFormTools } from "./tools/forms.js";
import { registerLeadTools } from "./tools/leads.js";
import { registerMailTools } from "./tools/mail.js";
import { registerOutreachTools } from "./tools/outreach.js";

export function createBritCrmMcpServer() {
  const server = new McpServer({
    name: "britcrm",
    title: "BritCRM Unified MCP Server",
    version: "0.1.0",
  });

  registerDocsResources(server);
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

main().catch((error) => {
  console.error("BritCRM MCP server failed to start:", error);
  process.exit(1);
});
