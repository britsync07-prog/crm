import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowUpRight,
  Plus,
  ShieldCheck,
  TrendingUp,
  FileSignature,
  FileText,
  CreditCard,
  Zap,
  Bookmark,
  Shield,
} from "lucide-react";
import { startOnboardingForDealAction } from "./actions";
import QuickOnboardModal from "@/components/onboarding/QuickOnboardModal";

import { ensureOnboardingDatabaseSchema } from "@/lib/onboarding/db-init";

export const dynamic = "force-dynamic";

export default async function OnboardingHubPage({
  searchParams,
}: {
  searchParams: Promise<{ health?: string; status?: string; search?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Ensure DB tables exist
  await ensureOnboardingDatabaseSchema();

  const { health, status, search } = await searchParams;

  const whereClause: any = {};
  if (health) whereClause.healthStatus = health;
  if (status) whereClause.status = status;
  if (search) {
    whereClause.OR = [
      { serviceName: { contains: search } },
      { client: { name: { contains: search } } },
      { client: { company: { contains: search } } },
    ];
  }

  let instances: any[] = [];
  let totalCount = 0;
  let healthyCount = 0;
  let atRiskCount = 0;
  let blockedCount = 0;
  let awaitingClientCount = 0;
  let awaitingApprovalCount = 0;
  let readyForActivationCount = 0;
  let completedCount = 0;
  let wonDeals: any[] = [];
  let eligibleCustomers: any[] = [];

  try {
    instances = await prisma.onboardingInstance.findMany({
      where: whereClause,
      include: {
        client: true,
        deal: true,
        template: true,
        actions: { select: { id: true, status: true, requiresApproval: true } },
        documents: { select: { id: true, status: true } },
        signatureRequests: { select: { id: true, status: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    totalCount = await prisma.onboardingInstance.count();
    healthyCount = await prisma.onboardingInstance.count({ where: { healthStatus: "HEALTHY" } });
    atRiskCount = await prisma.onboardingInstance.count({ where: { healthStatus: "AT_RISK" } });
    blockedCount = await prisma.onboardingInstance.count({ where: { healthStatus: "BLOCKED" } });
    awaitingClientCount = await prisma.onboardingInstance.count({ where: { status: "WAITING_CLIENT" } });
    awaitingApprovalCount = await prisma.onboardingInstance.count({ where: { status: "WAITING_HUMAN_APPROVAL" } });
    readyForActivationCount = await prisma.onboardingInstance.count({ where: { status: "READY_FOR_ACTIVATION" } });
    completedCount = await prisma.onboardingInstance.count({ where: { status: "COMPLETED" } });
  } catch (err) {
    console.error("[OnboardingHubPage] Error loading onboarding instances:", err);
  }

  try {
    wonDeals = await prisma.deal.findMany({
      where: {
        OR: [{ stage: "Won" }, { stage: "Closed Won" }],
        onboardings: { none: {} },
      },
      include: { customer: true, lead: true },
      take: 5,
    });
  } catch (err) {
    console.error("[OnboardingHubPage] Error loading won deals:", err);
  }

  try {
    eligibleCustomers = await prisma.customer.findMany({
      select: { id: true, name: true, company: true, email: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch (err) {
    console.error("[OnboardingHubPage] Error loading customers:", err);
  }

  const isAdmin = session?.role?.toUpperCase() === "ADMIN";

  let customTemplates: any[] = [];
  try {
    customTemplates = await prisma.documentTemplate.findMany({
      where: {
        isActive: true,
        type: { startsWith: "CUSTOM_" },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.error("[OnboardingHubPage] Error loading custom templates:", err);
  }

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto pb-24 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#012169] dark:text-blue-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> AI Operations Engine
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-zinc-50 uppercase italic">
            Onboarding <span className="text-[#012169] dark:text-blue-400">Hub</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 font-medium mt-1">
            Autonomous client preparation with mandatory human oversight. AI prepares, humans approve, CRM executes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <QuickOnboardModal
            customers={eligibleCustomers}
            isAdmin={isAdmin}
            customTemplates={customTemplates}
          />
          <Link
            href="/onboarding/admin"
            className="px-5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm flex items-center gap-1.5"
          >
            {isAdmin ? (
              <>
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>Template Studio (Admin)</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-blue-500" />
                <span>My Templates</span>
              </>
            )}
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Total Active", count: totalCount, color: "text-slate-900 dark:text-white" },
          { label: "Healthy", count: healthyCount, color: "text-emerald-500" },
          { label: "At Risk", count: atRiskCount, color: "text-amber-500" },
          { label: "Blocked", count: blockedCount, color: "text-red-500" },
          { label: "Awaiting Approval", count: awaitingApprovalCount, color: "text-purple-500" },
          { label: "Awaiting Client", count: awaitingClientCount, color: "text-blue-500" },
          { label: "Ready to Activate", count: readyForActivationCount, color: "text-indigo-500" },
          { label: "Completed", count: completedCount, color: "text-teal-500" },
        ].map((m) => (
          <div
            key={m.label}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/5 shadow-sm space-y-1"
          >
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 line-clamp-1 truncate">
              {m.label}
            </p>
            <p className={`text-2xl font-black ${m.color}`}>{m.count}</p>
          </div>
        ))}
      </div>

      {/* Uninitiated Won Deals Alert (if any) */}
      {wonDeals.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#012169] text-white flex items-center justify-center shrink-0 shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {wonDeals.length} Won Deal{wonDeals.length > 1 ? "s" : ""} Ready for Onboarding
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium">
                Deals marked as Won can be instantly converted into an AI-coordinated onboarding workflow.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {wonDeals.map((deal: any) => (
              <form
                key={deal.id}
                action={async () => {
                  "use server";
                  await startOnboardingForDealAction(deal.id);
                }}
              >
                <button
                  type="submit"
                  className="bg-[#012169] hover:bg-[#c8102e] text-white px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Start: {deal.customer?.company || deal.name}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      {/* Active Onboardings Table & Filter Suite */}
      <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/5 rounded-[32px] p-6 md:p-8 shadow-sm space-y-6">
        {/* Table Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Filter Health:</span>
            <div className="flex items-center gap-1.5">
              <Link
                href="/onboarding"
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                  !health ? "bg-[#012169] text-white" : "bg-slate-100 dark:bg-white/5 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </Link>
              <Link
                href="/onboarding?health=HEALTHY"
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                  health === "HEALTHY" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                Healthy
              </Link>
              <Link
                href="/onboarding?health=AT_RISK"
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                  health === "AT_RISK" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                }`}
              >
                At Risk
              </Link>
              <Link
                href="/onboarding?health=BLOCKED"
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                  health === "BLOCKED" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                Blocked
              </Link>
            </div>
          </div>

          <div className="text-xs font-medium text-slate-400">
            Showing {instances.length} active onboarding{instances.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Pipeline List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="pb-4">Client & Company</th>
                <th className="pb-4">Service & Template</th>
                <th className="pb-4">Status & Stage</th>
                <th className="pb-4">Health Status</th>
                <th className="pb-4">Progress</th>
                <th className="pb-4">Pending Approvals</th>
                <th className="pb-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {instances.map((inst: any) => {
                const pendingApprovalCount = inst.actions.filter(
                  (a: any) => a.status === "PENDING_APPROVAL" && a.requiresApproval
                ).length;

                return (
                  <tr key={inst.id} className="group hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {inst.client.company || inst.client.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{inst.client.name} &bull; {inst.client.email}</div>
                    </td>

                    <td className="py-4">
                      <div className="font-bold text-slate-800 dark:text-zinc-200">
                        {inst.serviceName}
                      </div>
                      <div className="text-[10px] font-medium text-slate-400">
                        {inst.template?.name || "Standard Template"}
                      </div>
                    </td>

                    <td className="py-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-[#012169] dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
                        {inst.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-4">
                      <div className="flex items-center gap-1.5">
                        {inst.healthStatus === "HEALTHY" && (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                          </span>
                        )}
                        {inst.healthStatus === "AT_RISK" && (
                          <span className="flex items-center gap-1 text-amber-600 font-bold text-[11px]" title={inst.healthReason || ""}>
                            <AlertTriangle className="w-3.5 h-3.5" /> At Risk
                          </span>
                        )}
                        {inst.healthStatus === "BLOCKED" && (
                          <span className="flex items-center gap-1 text-red-600 font-bold text-[11px]" title={inst.healthReason || ""}>
                            <XCircle className="w-3.5 h-3.5" /> Blocked
                          </span>
                        )}
                      </div>
                      {inst.healthReason && inst.healthStatus !== "HEALTHY" && (
                        <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px]">
                          {inst.healthReason}
                        </div>
                      )}
                    </td>

                    <td className="py-4">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>{inst.progressPercentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#012169] dark:bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${inst.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-4">
                      {pendingApprovalCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
                          {pendingApprovalCount} Awaiting Review
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Clear</span>
                      )}
                    </td>

                    <td className="py-4 text-right">
                      <Link
                        href={`/onboarding/${inst.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-[#012169] hover:text-white text-slate-700 dark:text-zinc-200 text-xs font-black uppercase tracking-wider transition-all"
                      >
                        Open <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {instances.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600" />
              <p className="text-sm font-black uppercase tracking-wider text-slate-400">
                No onboarding instances match this filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
