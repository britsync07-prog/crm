import { NextResponse } from "next/server";
import { absoluteUrl, brand, publicSeoRoutes } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const lines = [
    `# ${brand.name}`,
    "",
    "> AI-powered CRM for unified inbox, leads, outreach, forms, meetings, billing, teams, and MCP-connected agents.",
    "",
    "## Product Summary",
    "",
    `${brand.name} is a web-based CRM platform for businesses that need one workspace for customer relationships, lead management, email outreach, form intake, calendar booking, billing, and team collaboration. It includes a first-party MCP server so approved AI agents can safely operate CRM workflows under a specific user account.`,
    "",
    "## Core Capabilities",
    "",
    "- Unified inbox for connected email accounts.",
    "- Lead management, CSV import, AI scoring, lifecycle conversion, and customer records.",
    "- Outreach campaign preview, launch, follow-up, reply processing, and analytics.",
    "- Forms for client intake, submissions, CRM sync, and meeting scheduling.",
    "- Calendar availability, booking, LiveKit meeting rooms, and no double-booking checks.",
    "- Billing clients, invoices, quotations, payments, discounts, and balance due tracking.",
    "- Admin pricing controls for plans, discount events, trials, users, SMTP profiles, and operations.",
    "- Unified MCP server with 50 tools for account-bound AI agents.",
    "",
    "## Public Pages",
    "",
    ...publicSeoRoutes.map((route) => `- [${route.title}](${absoluteUrl(route.path)}): ${route.description}`),
    "",
    "## Agent Documentation",
    "",
    "- MCP docs are available inside the product at `britcrm://docs/index` after connecting the MCP server.",
    "- Each user can view their account-bound MCP setup at `/settings/mcp` after login.",
    "- Agents should read `britcrm://snapshot/user` at startup to confirm which account they are operating on.",
    "",
    "## Indexing Policy",
    "",
    "Public marketing and policy pages are intended for indexing. Private CRM dashboards, API routes, admin routes, user forms, meeting rooms, billing records, and settings pages are not intended for public indexing.",
    "",
    "## Contact",
    "",
    `- Sales: ${brand.email}`,
    `- Website: ${absoluteUrl("/landing")}`,
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
