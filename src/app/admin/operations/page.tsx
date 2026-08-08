import { requireAdmin } from "@/lib/admin-guard";
import { getAdminOperationsAction } from "../admin-actions";
import { Activity, AlertTriangle, CheckCircle2, Database, Mail, ShieldCheck, Users, Workflow } from "lucide-react";

export const dynamic = "force-dynamic";

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div>
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{label}</p>
        <p className="text-xs text-zinc-400 mt-0.5">{detail}</p>
      </div>
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
        ok ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300"
      }`}>
        {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
        {ok ? "OK" : "Needs Setup"}
      </span>
    </div>
  );
}

export default async function AdminOperationsPage() {
  await requireAdmin();
  const ops = await getAdminOperationsAction();
  const counts = ops.counts;

  const tiles = [
    { label: "Users", value: counts.users, icon: Users },
    { label: "Organizations", value: counts.organizations, icon: ShieldCheck },
    { label: "Mailboxes", value: counts.emailAccounts, icon: Mail },
    { label: "Running Campaigns", value: counts.runningCampaigns, icon: Workflow },
    { label: "Forms", value: counts.forms, icon: Database },
    { label: "Submissions", value: counts.submissions, icon: Activity },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 sm:py-12 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#012169] flex items-center justify-center shadow-lg shadow-blue-900/20">
          <Activity className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Operations</h1>
          <p className="text-zinc-500 font-medium text-sm">SaaS health, configuration, workload, and admin activity</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="p-5 rounded-[20px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm">
            <tile.icon className="w-5 h-5 text-[#012169] mb-4" />
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{tile.value}</p>
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-1">{tile.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">Configuration</h2>
          <StatusRow label="Database" ok={ops.config.database} detail="Prisma SQLite connection is available." />
          <StatusRow label="JWT Secret" ok={ops.config.jwt} detail="Required for login sessions and API auth." />
          <StatusRow label="Transactional SMTP" ok={ops.config.transactionalEmail} detail="Required for forgot-password and system emails." />
          <StatusRow label="Newsletter SMTP" ok={ops.config.newsletterEmail} detail="Required for admin newsletter sends." />
          <StatusRow label="Stripe" ok={ops.config.stripe} detail="Required for checkout, portal, and webhook billing updates." />
        </div>

        <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Workload Risks</h2>
          <div className="grid gap-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60">
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">{counts.incompleteMailboxes}</p>
              <p className="text-xs text-zinc-500 mt-1">Mailboxes missing IMAP host or port</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60">
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">{counts.activeMailboxes}</p>
              <p className="text-xs text-zinc-500 mt-1">Active connected mailboxes</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60">
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">{counts.pendingScrapeJobs}</p>
              <p className="text-xs text-zinc-500 mt-1">Pending or running scrape jobs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-5">Recent Admin Activity</h2>
        <div className="space-y-2">
          {ops.recentActivity.map((log) => (
            <div key={log.id} className="flex flex-col gap-1 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{log.action}</p>
                {log.details && <p className="text-xs text-zinc-400 truncate">{log.details}</p>}
              </div>
              <p className="text-[11px] text-zinc-400 shrink-0">
                {log.user.name || log.user.email} · {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {ops.recentActivity.length === 0 && (
            <p className="text-sm text-zinc-400 py-8 text-center">No activity logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
