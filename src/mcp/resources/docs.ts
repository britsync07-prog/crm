import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

type DocsResource = {
  name: string;
  uri: string;
  title: string;
  description: string;
  fileName: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const docsRoot = path.join(repoRoot, "docs", "mcp");

export const docsResources: DocsResource[] = [
  {
    name: "britcrm.docs.index",
    uri: "britcrm://docs/index",
    title: "BritCRM MCP Server Plan",
    description: "Main documentation index for the unified BritCRM MCP server.",
    fileName: "README.md",
  },
  {
    name: "britcrm.docs.mail",
    uri: "britcrm://docs/mail",
    title: "Mail MCP Plan",
    description: "Unified inbox, mailbox, draft reply, send, and batch mail plan.",
    fileName: "mail-mcp-plan.md",
  },
  {
    name: "britcrm.docs.leads",
    uri: "britcrm://docs/leads",
    title: "Leads MCP Plan",
    description: "Lead listing, creation, upload, scoring, interaction, and conversion plan.",
    fileName: "leads-mcp-plan.md",
  },
  {
    name: "britcrm.docs.outreach",
    uri: "britcrm://docs/outreach",
    title: "Outreach MCP Plan",
    description: "Campaign, outreach, follow-up, reply, and analytics plan.",
    fileName: "outreach-mcp-plan.md",
  },
  {
    name: "britcrm.docs.forms",
    uri: "britcrm://docs/forms",
    title: "Forms MCP Plan",
    description: "Form creation, sharing, submission, CRM sync, and meeting intake plan.",
    fileName: "forms-mcp-plan.md",
  },
  {
    name: "britcrm.docs.calendar",
    uri: "britcrm://docs/calendar",
    title: "Calendar MCP Plan",
    description: "Availability, calendar events, booking, and no double-booking plan.",
    fileName: "calendar-mcp-plan.md",
  },
  {
    name: "britcrm.docs.billing",
    uri: "britcrm://docs/billing",
    title: "Billing MCP Plan",
    description: "Billing client, invoice, quote, payment, and balance plan.",
    fileName: "billing-mcp-plan.md",
  },
  {
    name: "britcrm.docs.admin",
    uri: "britcrm://docs/admin",
    title: "Admin And Pricing MCP Plan",
    description: "Admin, pricing, discount, trial, user, and operations plan.",
    fileName: "admin-pricing-mcp-plan.md",
  },
];

async function readDocsFile(fileName: string) {
  return readFile(path.join(docsRoot, fileName), "utf8");
}

export function registerDocsResources(server: McpServer) {
  for (const resource of docsResources) {
    server.registerResource(
      resource.name,
      resource.uri,
      {
        title: resource.title,
        description: resource.description,
        mimeType: "text/markdown",
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: await readDocsFile(resource.fileName),
          },
        ],
      })
    );
  }
}

