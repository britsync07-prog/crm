import Link from "next/link";
import { AlertTriangle, Bot, ExternalLink, KeyRound, Lock, Network, ShieldCheck, Workflow } from "lucide-react";
import { getAppBaseUrl } from "@/lib/app-url";
import {
  mcpErrorContract,
  mcpResponseContract,
  mcpSafetyRules,
  mcpSetupSteps,
  mcpToolGroups,
} from "@/lib/mcp-docs";

export const dynamic = "force-dynamic";

function codeBlock(value: unknown) {
  return JSON.stringify(value, null, 2);
}

const resources = [
  { uri: "britcrm://snapshot/user", purpose: "Account, role, organization, dashboard counts, recent activity, and upcoming events." },
  { uri: "britcrm://docs/index", purpose: "Complete MCP guide returned through the MCP resource API." },
  { uri: "britcrm://docs/mail", purpose: "Mail and unified inbox operating notes." },
  { uri: "britcrm://docs/leads", purpose: "Lead lifecycle, CSV import, scoring, and conversion notes." },
  { uri: "britcrm://docs/outreach", purpose: "Campaign preview, launch, follow-up, and reply-processing notes." },
  { uri: "britcrm://docs/forms", purpose: "Form creation, submissions, public intake, and sharing notes." },
  { uri: "britcrm://docs/calendar", purpose: "Availability, no-double-booking, events, and client meetings notes." },
  { uri: "britcrm://docs/billing", purpose: "BritLedger clients, invoices, quotations, payments, and balances notes." },
  { uri: "britcrm://docs/admin", purpose: "Admin pricing, discount events, trials, users, email profiles, and operations notes." },
];

const playbooks = [
  {
    title: "Reply To An Inbox Email",
    steps: ["mail.list_accounts", "mail.search_messages", "mail.read_message", "mail.draft_reply", "Show draft to user", "mail.send_email after approval"],
  },
  {
    title: "Create And Contact A Lead",
    steps: ["leads.list to avoid duplicates", "leads.create", "leads.log_interaction", "outreach.preview_campaign", "outreach.launch_campaign with confirm=true"],
  },
  {
    title: "Collect Client Intake",
    steps: ["forms.list", "forms.create", "forms.generate_share_message", "Send/share approved message", "forms.get_submissions"],
  },
  {
    title: "Book A Client Meeting",
    steps: ["calendar.get_settings", "calendar.check_availability", "calendar.book_client_meeting with confirm=false", "Confirm chosen slot", "calendar.book_client_meeting with confirm=true"],
  },
  {
    title: "Create Invoice And Balance",
    steps: ["billing.list_clients or billing.create_client", "billing.create_invoice with lineItems, discount, advancePayment", "Read calculations.balanceDue", "billing.record_payment when money is received"],
  },
  {
    title: "Admin Pricing Change",
    steps: ["admin.pricing.list_plans", "admin.pricing.upsert_plan with confirm=false", "Review preview", "admin.pricing.upsert_plan with confirm=true", "admin.operations.snapshot"],
  },
];

export default function McpDocsPage() {
  const endpoint = `${getAppBaseUrl()}/api/mcp`;
  const config = {
    mcpServers: {
      britcrm: {
        url: endpoint,
        headers: {
          Authorization: "Bearer bcrm_mcp_your_token_here",
        },
      },
    },
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-48px)] lg:overflow-auto">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#012169] text-white">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-black">BritCRM MCP</p>
                <p className="text-xs font-bold text-zinc-500">Agent Reference</p>
              </div>
            </div>
            <nav className="mt-5 space-y-1 text-sm font-bold">
              {[
                ["overview", "Overview"],
                ["setup", "Setup"],
                ["auth", "Auth"],
                ["contracts", "Responses"],
                ["resources", "Resources"],
                ["playbooks", "Playbooks"],
                ["tools", "Tool Catalog"],
                ["troubleshooting", "Troubleshooting"],
              ].map(([id, label]) => (
                <a key={id} href={`#${id}`} className="block rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100 hover:text-[#012169] dark:text-zinc-300 dark:hover:bg-zinc-800">
                  {label}
                </a>
              ))}
              <div className="pt-3">
                <p className="px-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Tools</p>
                {mcpToolGroups.map((group) => (
                  <a key={group.id} href={`#${group.id}`} className="block rounded-lg px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-[#012169] dark:text-zinc-300 dark:hover:bg-zinc-800">
                    {group.title}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        </aside>

        <div className="space-y-8">
          <header id="overview" className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#012169] dark:text-blue-300">Public No-Login Docs</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">BritCRM MCP Agent Documentation</h1>
                <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-zinc-600 dark:text-zinc-300">
                  This is the end-to-end operating manual for AI agents connected to BritCRM. It explains how to connect, authenticate, inspect account context, call tools, handle errors, and understand exactly what every tool changes in the CRM dashboard.
                </p>
              </div>
              <Link href="/settings/mcp" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#012169] px-4 py-3 text-sm font-black text-white">
                Create Token
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Transport", "Streamable HTTP"],
                ["Endpoint", "/api/mcp"],
                ["Tool Count", "50 tools"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
                  <p className="mt-2 break-all font-mono text-sm font-black">{value}</p>
                </div>
              ))}
            </div>
          </header>

          <section id="setup" className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <Network className="h-5 w-5 text-[#012169] dark:text-blue-300" />
              <h2 className="text-2xl font-black">Setup</h2>
            </div>
            <p className="mt-3 text-sm font-medium leading-7 text-zinc-600 dark:text-zinc-300">
              Every user creates their own bearer token. The agent receives only the hosted URL and token. It never receives server paths, database URLs, JWT secrets, or local environment variables.
            </p>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950">
                <p className="text-sm font-black">Agent Config</p>
                <pre className="mt-3 overflow-auto rounded-xl bg-zinc-950 p-4 text-xs leading-6 text-zinc-100 dark:bg-black">
                  <code>{codeBlock(config)}</code>
                </pre>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950">
                <p className="text-sm font-black">Required Startup Sequence</p>
                <ol className="mt-3 space-y-3 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                  {mcpSetupSteps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#012169] text-xs text-white">{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section id="auth" className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-[#012169] dark:text-blue-300" />
              <h2 className="text-2xl font-black">Authentication And Scope</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ["Bearer Token", "Send Authorization: Bearer bcrm_mcp_... on every MCP request."],
                ["User Scope", "Normal tools operate only on records owned by the token user."],
                ["Admin Scope", "Admin tools appear in the catalog but fail unless the token user role is ADMIN."],
                ["Revocation", "When a token is revoked from MCP settings, future calls return unauthorized."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="font-black">{title}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-zinc-600 dark:text-zinc-300">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="contracts" className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-[#012169] dark:text-blue-300" />
              <h2 className="text-2xl font-black">Response Contract</h2>
            </div>
            <p className="mt-3 text-sm font-medium leading-7 text-zinc-600 dark:text-zinc-300">
              Tool results are text content containing JSON. Agents should parse content[0].text, check success, and use data only when success is true.
            </p>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <p className="text-sm font-black">Success</p>
                <pre className="mt-3 overflow-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-100"><code>{codeBlock(mcpResponseContract)}</code></pre>
              </div>
              <div>
                <p className="text-sm font-black">Failure</p>
                <pre className="mt-3 overflow-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-100"><code>{codeBlock(mcpErrorContract)}</code></pre>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              <h2 className="text-2xl font-black text-amber-950 dark:text-amber-100">Safety Rules For Agents</h2>
            </div>
            <ul className="mt-5 grid gap-3 text-sm font-bold text-amber-950 dark:text-amber-100 lg:grid-cols-2">
              {mcpSafetyRules.map((rule) => (
                <li key={rule} className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </section>

          <section id="resources" className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-2xl font-black">Resources</h2>
            <p className="mt-3 text-sm font-medium leading-7 text-zinc-600 dark:text-zinc-300">
              Resources are read-only context documents. The most important resource is the account snapshot; agents should read it at startup to confirm the operating account.
            </p>
            <div className="mt-5 grid gap-3">
              {resources.map((resource) => (
                <div key={resource.uri} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="break-all font-mono text-xs font-black text-[#012169] dark:text-blue-300">{resource.uri}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-zinc-600 dark:text-zinc-300">{resource.purpose}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="playbooks" className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <Workflow className="h-5 w-5 text-[#012169] dark:text-blue-300" />
              <h2 className="text-2xl font-black">Agent Playbooks</h2>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {playbooks.map((playbook) => (
                <article key={playbook.title} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <h3 className="font-black">{playbook.title}</h3>
                  <ol className="mt-3 space-y-2 text-sm font-bold text-zinc-600 dark:text-zinc-300">
                    {playbook.steps.map((step, index) => (
                      <li key={step} className="flex gap-2">
                        <span className="font-mono text-xs text-zinc-400">{index + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </section>

          <section id="tools" className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-2xl font-black">Complete Tool Catalog</h2>
              <p className="mt-3 text-sm font-medium leading-7 text-zinc-600 dark:text-zinc-300">
                This catalog tells an agent when to use each tool, what input to send, what comes back, and what dashboard data changes.
              </p>
            </div>

            {mcpToolGroups.map((group) => (
              <article key={group.id} id={group.id} className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-2xl font-black">{group.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-7 text-zinc-600 dark:text-zinc-300">{group.purpose}</p>
                  </div>
                  <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs font-black leading-5 text-[#012169] dark:bg-blue-950/30 dark:text-blue-100">
                    {group.startupCheck}
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  {group.tools.map((tool) => (
                    <section key={tool.name} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <h4 className="break-all font-mono text-sm font-black text-zinc-950 dark:text-zinc-50">{tool.name}</h4>
                        <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${tool.writes ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-200" : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-200"}`}>
                          {tool.writes ? "Writes Data" : "Read Only"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-medium leading-6 text-zinc-600 dark:text-zinc-300">{tool.purpose}</p>
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Input</p>
                            <p className="mt-1 font-medium leading-6 text-zinc-700 dark:text-zinc-200">{tool.input}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Returns</p>
                            <p className="mt-1 font-medium leading-6 text-zinc-700 dark:text-zinc-200">{tool.returns}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Dashboard Impact</p>
                            <p className="mt-1 font-medium leading-6 text-zinc-700 dark:text-zinc-200">{tool.dashboardImpact}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Safety</p>
                            <p className="mt-1 font-medium leading-6 text-zinc-700 dark:text-zinc-200">{tool.safety}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Example Arguments</p>
                          {Object.keys(tool.example).length === 0 ? (
                            <div className="mt-2 rounded-xl bg-zinc-950 p-4 text-xs font-bold leading-6 text-zinc-100">
                              No arguments required. Call this tool with an empty arguments object.
                              <pre className="mt-3 overflow-auto rounded-lg bg-black/40 p-3 font-mono">
                                <code>{codeBlock({})}</code>
                              </pre>
                            </div>
                          ) : (
                            <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-zinc-950 p-4 text-xs leading-6 text-zinc-100">
                              <code>{codeBlock(tool.example)}</code>
                            </pre>
                          )}
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section id="troubleshooting" className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-2xl font-black">Troubleshooting</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {[
                ["401 Unauthorized", "Token is missing, malformed, expired, revoked, or belongs to an inactive user. Create a fresh token in MCP Settings."],
                ["Admin Tool Fails", "The token user is not ADMIN, or the tool was called without required confirmation."],
                ["No Mail Accounts", "The user must connect an active mailbox in Settings > Email before mail or outreach sends."],
                ["Outreach Shows Pending", "Launch is asynchronous. Wait briefly, then call outreach.get_campaign or outreach.list_campaigns."],
                ["Billing Fails", "BritLedger may be unavailable or user billing sync may need server credentials."],
                ["Tool Error JSON", "Parse content[0].text as JSON and show error to the user. Do not assume data exists when success is false."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="font-black">{title}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-zinc-600 dark:text-zinc-300">{text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
