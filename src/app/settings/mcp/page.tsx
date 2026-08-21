import { redirect } from "next/navigation";
import { Bot, BookOpen, CheckCircle2, Database, KeyRound, ShieldCheck, Terminal } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  const mcpConfig = {
    mcpServers: {
      britcrm: {
        command: "npm",
        args: ["run", "mcp", "--silent"],
        cwd: "D:\\job\\crm",
        env: {
          JWT_SECRET: "use-the-same-JWT_SECRET-as-your-CRM-server",
          DATABASE_URL: "file:./prisma/dev.db",
          BRITCRM_MCP_USER_ID: user.id,
          BRITCRM_MCP_USER_EMAIL: user.email,
        },
      },
    },
  };

  const resourceList = [
    "britcrm://docs/index",
    "britcrm://snapshot/user",
    "britcrm://docs/mail",
    "britcrm://docs/leads",
    "britcrm://docs/outreach",
    "britcrm://docs/forms",
    "britcrm://docs/calendar",
    "britcrm://docs/billing",
    ...(user.role === "ADMIN" ? ["britcrm://docs/admin"] : []),
  ];

  const dashboardCounts = [
    { label: "Mailboxes", value: mailboxes },
    { label: "Leads", value: leads },
    { label: "Campaigns", value: campaigns },
    { label: "Forms", value: forms },
    { label: "Calendar Events", value: calendarEvents },
  ];

  const organization = user.ownedOrganization || user.memberProfile?.organization || null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#012169] text-white shadow-xl shadow-blue-900/20">
            <Bot className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">MCP Agents</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-500">
              Connect an AI agent to your own BritCRM account. Any MCP action runs as your user and appears in your dashboard data.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          <span className="text-zinc-400">Account:</span> {user.email}
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
              Use both `BRITCRM_MCP_USER_ID` and `BRITCRM_MCP_USER_EMAIL` for the strongest binding. If they do not match, the MCP server rejects the session.
            </p>
          </div>
        </section>

        <section className="lg:col-span-7 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-[#012169] dark:text-blue-300" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Agent MCP Config</h2>
          </div>
          <pre className="mt-6 max-h-[520px] overflow-auto rounded-xl bg-zinc-950 p-4 text-xs leading-6 text-zinc-100">
            <code>{codeBlock(mcpConfig)}</code>
          </pre>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-[#012169] dark:text-blue-300" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Agent Docs</h2>
          </div>
          <ul className="mt-5 space-y-3">
            {resourceList.map((uri) => (
              <li key={uri} className="break-all rounded-xl bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                {uri}
              </li>
            ))}
          </ul>
        </section>

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
            <KeyRound className="h-5 w-5 text-[#012169] dark:text-blue-300" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Required Server Env</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm font-bold text-zinc-600 dark:text-zinc-300">
            <p>`JWT_SECRET` must match the CRM server secret.</p>
            <p>`DATABASE_URL` must point to the CRM database.</p>
            <p>`BRITLEDGER_PASSWORD_SECRET` is recommended for billing tools.</p>
            <p>Admin tools are visible to all clients, but calls fail unless your CRM role is `ADMIN`.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
