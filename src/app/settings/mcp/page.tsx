import { redirect } from "next/navigation";
import {
  Bot,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Crown,
  Database,
  ExternalLink,
  FileText,
  Globe2,
  Mail,
  ReceiptText,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAppBaseUrl } from "@/lib/app-url";
import { listMcpAccessTokens } from "@/lib/mcp-tokens";
import { listOAuthClients } from "@/lib/oauth-store";
import { McpTokenManager, type McpTokenView } from "@/components/McpTokenManager";
import { OAuthClientManager, type OAuthClientView } from "@/components/OAuthClientManager";

export const dynamic = "force-dynamic";

function codeBlock(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default async function McpSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/landing");

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      ownedOrganization: { select: { name: true, plan: true, subscriptionStatus: true } },
      memberProfile: {
        select: {
          organization: { select: { name: true, plan: true, subscriptionStatus: true } },
        },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") redirect("/landing");

  const [mailboxes, leads, campaigns, forms, calendarEvents] = await Promise.all([
    prisma.emailAccount.count({ where: { userId: user.id, isActive: true } }),
    prisma.lead.count({ where: { userId: user.id } }),
    prisma.campaign.count({ where: { userId: user.id } }),
    prisma.form.count({ where: { ownerId: user.id } }),
    prisma.calendarEvent.count({ where: { userId: user.id } }),
  ]);

  const endpoint = `${getAppBaseUrl()}/api/mcp`;
  const [tokensRaw, oauthClientsRaw] = await Promise.all([
    listMcpAccessTokens(user.id),
    listOAuthClients(user.id),
  ]);

  const tokens = tokensRaw.map((token): McpTokenView => ({
    id: token.id,
    name: token.name,
    lastFour: token.lastFour,
    createdAt: token.createdAt.toISOString(),
    updatedAt: token.updatedAt.toISOString(),
    lastUsedAt: token.lastUsedAt?.toISOString() || null,
    expiresAt: token.expiresAt?.toISOString() || null,
    revokedAt: token.revokedAt?.toISOString() || null,
  }));

  const oauthClients: OAuthClientView[] = oauthClientsRaw.map((client) => ({
    id: client.id,
    name: client.name,
    clientId: client.clientId,
    clientSecret: client.clientSecret,
    redirectUris: client.redirectUris,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
    revokedAt: client.revokedAt?.toISOString() || null,
    activeTokenCount: client.activeTokenCount || 0,
  }));

  const mcpConfig = {
    mcpServers: {
      britcrm: {
        url: endpoint,
        headers: {
          Authorization: "Bearer bcrm_mcp_your_token_here",
        },
      },
    },
  };

  const dashboardCounts = [
    { label: "Mailboxes", value: mailboxes },
    { label: "Leads", value: leads },
    { label: "Campaigns", value: campaigns },
    { label: "Forms", value: forms },
    { label: "Calendar Events", value: calendarEvents },
  ];

  const organization = user.ownedOrganization || user.memberProfile?.organization || null;
  const docSections = [
    {
      id: "setup",
      title: "Setup",
      icon: Terminal,
      description: "Create a token, add the hosted endpoint to the agent, then read the account snapshot before calling tools.",
      workflow: ["Create a token from Hosted MCP Access or Standard OAuth.", "Paste the generated config into the MCP client or Gemini.", "Ask the agent to read the account snapshot before any write."],
      tools: ["resources/read", "tools/list", "tools/call"],
    },
    {
      id: "snapshot",
      title: "Account Snapshot",
      icon: FileText,
      description: "Confirms which CRM user, role, organization, counts, upcoming events, and recent activity the agent is operating on.",
      workflow: ["Read snapshot at startup.", "Confirm email and role with the user.", "Use returned counts and IDs as context for later work."],
      tools: ["account snapshot resource"],
    },
    {
      id: "mail",
      title: "Mail",
      icon: Mail,
      description: "Manage connected inboxes, read messages, draft replies, send approved email, and perform mailbox actions.",
      workflow: ["List connected accounts.", "Search or read messages.", "Draft first, send only after approval."],
      tools: ["mail.list_accounts", "mail.search_messages", "mail.read_message", "mail.draft_reply", "mail.send_email", "mail.batch_action"],
    },
    {
      id: "leads",
      title: "Leads",
      icon: Users,
      description: "List, create, update, upload, score, log interactions, and convert user-owned leads.",
      workflow: ["List or upload leads.", "Open a lead before updating it.", "Log every important call, note, or reply."],
      tools: [
        "leads.list",
        "leads.get",
        "leads.create",
        "leads.update",
        "leads.upload_csv",
        "leads.score",
        "leads.log_interaction",
        "leads.convert_to_customer",
        "leads.list_categories",
        "leads.create_category",
      ],
    },
    {
      id: "outreach",
      title: "Outreach",
      icon: Send,
      description: "Preview campaigns, launch approved outreach, send follow-ups, process replies, and inspect campaign analytics.",
      workflow: ["Preview recipients and sender accounts.", "Get explicit approval.", "Launch with confirm true and process replies later."],
      tools: ["outreach.preview_campaign", "outreach.launch_campaign", "outreach.list_campaigns", "outreach.get_campaign", "outreach.send_follow_up", "outreach.process_replies"],
    },
    {
      id: "forms",
      title: "Forms",
      icon: ClipboardList,
      description: "Create forms, generate share messages, inspect submissions, and sync intake data into CRM records.",
      workflow: ["Create the form and fields.", "Share the public form link.", "Review submissions and meeting intake data."],
      tools: ["forms.list", "forms.create", "forms.delete", "forms.get_submissions", "forms.submit_public", "forms.generate_share_message"],
    },
    {
      id: "calendar",
      title: "Calendar",
      icon: CalendarDays,
      description: "Manage availability, check free slots, create events, book client meetings, and cancel events safely.",
      workflow: ["Read settings.", "Check availability before booking.", "Use confirm true only after approval for client meetings."],
      tools: ["calendar.get_settings", "calendar.update_settings", "calendar.list_events", "calendar.check_availability", "calendar.create_event", "calendar.book_client_meeting", "calendar.cancel_event"],
    },
    {
      id: "billing",
      title: "Billing",
      icon: ReceiptText,
      description: "Manage BritLedger clients, invoices, quotations, payments, balances, and invoice email sending.",
      workflow: ["List or create a client.", "Create invoice or quote with line items.", "Use returned balance due and record payments later."],
      tools: ["billing.list_clients", "billing.create_client", "billing.list_invoices", "billing.create_invoice", "billing.update_invoice", "billing.record_payment", "billing.create_quotation", "billing.list_quotations", "billing.convert_quote_to_invoice", "billing.send_invoice"],
    },
    ...(user.role === "ADMIN"
      ? [
          {
            id: "admin",
            title: "Admin",
            icon: Crown,
            description: "Manage pricing plans, discount events, trials, users, system email profiles, and operations snapshots.",
            workflow: ["Preview admin changes with confirm false.", "Apply only after approval.", "Audit operations and activity after changes."],
            tools: ["admin.pricing.list_plans", "admin.pricing.upsert_plan", "admin.pricing.upsert_discount_event", "admin.users.search", "admin.users.update", "admin.system_email.update_profile", "admin.operations.snapshot"],
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#012169] text-white shadow-xl shadow-blue-900/20">
            <Bot className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">MCP Agents</h1>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase text-[#012169] dark:bg-blue-950 dark:text-blue-300">
                OAuth 2.0 & Bearer
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-500">
              Connect AI agents and tools to your BritCRM account. Supports Claude, Cursor, Windsurf, and Google Gemini Spark Connected Apps.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href="#gemini-oauth"
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-black text-[#012169] hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
          >
            <Sparkles className="h-4 w-4" />
            Gemini OAuth Section
          </a>
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            <span className="text-zinc-400">Account:</span> {user.email}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {dashboardCounts.map((item) => (
          <div key={item.label} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{item.label}</p>
            <p className="mt-3 text-3xl font-black text-zinc-900 dark:text-zinc-50">{item.value}</p>
          </div>
        ))}
      </div>

      {/* DEDICATED SEPARATED STANDARD OAUTH SECTION FOR GEMINI SPARK & CONNECTED APPS */}
      <section
        id="gemini-oauth"
        className="rounded-3xl border-2 border-blue-200 bg-white p-6 sm:p-8 shadow-sm dark:border-blue-900/50 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#012169] to-[#0a389c] text-white shadow-lg shadow-blue-900/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                  Standard OAuth 2.0 (Gemini Spark & Custom Connected Apps)
                </h2>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#012169] dark:bg-blue-950 dark:text-blue-300">
                  Google Gemini Ready
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-zinc-500">
                Generate standard OAuth 2.0 credentials (Client ID & Client Secret) required when connecting BritCRM to Google Gemini Spark.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <OAuthClientManager endpoint={endpoint} clients={oauthClients} />
        </div>
      </section>

      {/* ACCOUNT BINDING & JSON CONFIG */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#012169] dark:text-blue-300" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Account Binding</h2>
          </div>
          <div className="mt-6 space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">User ID</p>
              <p className="mt-1 break-all font-mono text-xs text-zinc-900 dark:text-zinc-100">{user.id}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Role</p>
              <p className="mt-1 font-black text-zinc-900 dark:text-zinc-100">{user.role}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Organization</p>
              <p className="mt-1 font-bold text-zinc-900 dark:text-zinc-100">
                {organization ? `${organization.name} - ${organization.plan} / ${organization.subscriptionStatus}` : "No organization linked"}
              </p>
            </div>
            <p className="rounded-xl bg-blue-50 p-4 text-xs font-bold leading-6 text-[#012169] dark:bg-blue-950/30 dark:text-blue-100">
              MCP tokens and OAuth credentials are bound to this CRM account. Server secrets stay secure on the CRM server.
            </p>
          </div>
        </section>

        <section className="lg:col-span-7 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-[#012169] dark:text-blue-300" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Agent MCP Config (Claude / Cursor)</h2>
          </div>
          <pre className="mt-6 max-h-[520px] overflow-auto rounded-xl bg-zinc-950 p-4 text-xs leading-6 text-zinc-100">
            <code>{codeBlock(mcpConfig)}</code>
          </pre>
        </section>
      </div>

      {/* PERSONAL MCP BEARER TOKENS SECTION (UNTOUCHED) */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <Globe2 className="h-5 w-5 text-[#012169] dark:text-blue-300" />
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
              Personal Bearer Tokens (Direct MCP Access)
            </h2>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Used for direct command-line or config-based MCP clients like Claude Desktop, Cursor, and Windsurf.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <McpTokenManager endpoint={endpoint} tokens={tokens} />
        </div>
      </section>

      {/* DOCUMENTATION */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-[#012169] dark:text-blue-300" />
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Agent Documentation</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
              One-page MCP guide for agents. Use the navigation, scroll to the needed workflow, then call tools with the account-bound credentials from this page.
            </p>
          </div>
          <Link href="/mcp/docs" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#012169] px-4 py-3 text-sm font-black text-white">
            Open Docs Page
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <nav className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {docSections.map((section) => {
            const Icon = section.icon;
            return (
              <a
                key={section.id}
                href={`#mcp-doc-${section.id}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700 hover:border-[#012169] hover:text-[#012169] dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-blue-300 dark:hover:text-blue-200"
              >
                <Icon className="h-4 w-4" />
                {section.title}
              </a>
            );
          })}
        </nav>

        <div className="mt-6 space-y-5">
          {docSections.map((section) => {
            const Icon = section.icon;
            return (
              <article key={section.id} id={`mcp-doc-${section.id}`} className="scroll-mt-24 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#012169] dark:bg-blue-950/30 dark:text-blue-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">{section.title}</h3>
                      <p className="mt-1 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">{section.description}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Agent Workflow</p>
                    <ul className="mt-3 space-y-2 text-sm font-bold text-zinc-600 dark:text-zinc-300">
                      {section.workflow.map((item) => (
                        <li key={item} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tools And Resources</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {section.tools.map((tool) => (
                        <span key={tool} className="rounded-lg bg-zinc-100 px-2.5 py-1.5 font-mono text-[11px] font-bold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-[#012169] dark:text-blue-300" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Dashboard Mapping</h2>
          </div>
          <ul className="mt-5 space-y-3 text-sm font-bold text-zinc-600 dark:text-zinc-300">
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> `leads.*` writes appear in Leads.</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> `mail.*` uses your connected mailboxes.</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> `outreach.*` creates campaigns under your account.</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> `forms.*` creates your forms and submissions.</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> `calendar.*` books your calendar events.</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> `billing.*` uses your BritLedger billing account.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#012169] dark:text-blue-300" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Server Managed</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm font-bold text-zinc-600 dark:text-zinc-300">
            <p>Users do not configure database paths or application secrets.</p>
            <p>The CRM server authenticates each MCP request via standard OAuth 2.0 or personal bearer token.</p>
            <p>Revoking an OAuth client or token immediately blocks that agent from future calls.</p>
            <p>Admin tools are visible to all clients, but calls fail unless your CRM role is `ADMIN`.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
