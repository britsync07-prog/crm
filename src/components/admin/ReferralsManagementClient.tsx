"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Share2,
  Users,
  Eye,
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  Download,
  AlertCircle,
  X,
  Loader2,
  MousePointerClick,
  UserCheck,
  CreditCard,
  Building,
  Calendar,
  Globe,
  Tag,
  ArrowUpDown,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createReferralLinkAction,
  updateReferralLinkAction,
  toggleReferralLinkStatusAction,
  deleteReferralLinkAction,
} from "@/app/admin/admin-actions";
import type {
  ReferralOverviewStats,
  ReferralLinkRecord,
  ReferredClientRecord,
  ReferralVisitDetail,
} from "@/lib/referral";

interface Props {
  initialOverview: ReferralOverviewStats;
  initialLinks: ReferralLinkRecord[];
  baseUrl: string;
}

export default function ReferralsManagementClient({
  initialOverview,
  initialLinks,
  baseUrl,
}: Props) {
  const [overview] = useState<ReferralOverviewStats>(initialOverview);
  const [links, setLinks] = useState<ReferralLinkRecord[]>(initialLinks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [sortBy, setSortBy] = useState<"visits" | "signups" | "purchases" | "revenue" | "newest">("visits");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ReferralLinkRecord | null>(null);
  const [detailTarget, setDetailTarget] = useState<ReferralLinkRecord | null>(null);

  // Detail Modal data
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailClients, setDetailClients] = useState<ReferredClientRecord[]>([]);
  const [detailVisits, setDetailVisits] = useState<ReferralVisitDetail[]>([]);
  const [detailTab, setDetailTab] = useState<"clients" | "visits">("clients");

  // Transitions
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Copy handler
  const copyLink = (code: string, id: string) => {
    const fullUrl = `${baseUrl}/r/${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    toast.success(`Copied: ${fullUrl}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter & Sort
  const filteredLinks = useMemo(() => {
    let result = [...links];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.agencyName.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q) ||
          (l.notes && l.notes.toLowerCase().includes(q))
      );
    }

    if (statusFilter === "active") {
      result = result.filter((l) => l.isActive);
    } else if (statusFilter === "paused") {
      result = result.filter((l) => !l.isActive);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "visits":
          return b.visitsCount - a.visitsCount;
        case "signups":
          return b.signupsCount - a.signupsCount;
        case "purchases":
          return b.purchasesCount - a.purchasesCount;
        case "revenue":
          return b.totalRevenue - a.totalRevenue;
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [links, search, statusFilter, sortBy]);

  // Open Details Modal
  const openDetails = async (link: ReferralLinkRecord) => {
    setDetailTarget(link);
    setDetailLoading(true);
    setDetailTab("clients");
    try {
      const res = await fetch(`/api/admin/referrals/${link.id}`);
      const data = await res.json();
      if (res.ok) {
        setDetailClients(data.clients || []);
        setDetailVisits(data.recentVisits || []);
      } else {
        toast.error(data.error || "Failed to load link details");
      }
    } catch {
      toast.error("Failed to fetch detailed analytics");
    } finally {
      setDetailLoading(false);
    }
  };

  // Toggle status
  const handleToggle = (link: ReferralLinkRecord) => {
    startTransition(async () => {
      const res = await toggleReferralLinkStatusAction(link.id, link.isActive);
      if (res.success) {
        setLinks((prev) =>
          prev.map((l) => (l.id === link.id ? { ...l, isActive: !l.isActive } : l))
        );
        toast.success(`Link is now ${!link.isActive ? "Active" : "Paused"}`);
      } else {
        toast.error(res.error || "Failed to update link status");
      }
    });
  };

  // Delete link
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete referral link for "${name}"? Click logs and conversion records will also be removed.`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteReferralLinkAction(id);
      if (res.success) {
        setLinks((prev) => prev.filter((l) => l.id !== id));
        toast.success("Referral link deleted");
      } else {
        toast.error(res.error || "Failed to delete referral link");
      }
    });
  };

  // Export CSV
  const exportCsv = () => {
    if (filteredLinks.length === 0) {
      toast.error("No referral links to export");
      return;
    }

    const headers = [
      "Agency Name",
      "Referral Code",
      "Referral Link",
      "Destination URL",
      "Total Visits",
      "Unique Visitors",
      "Signups",
      "Visit-to-Signup %",
      "Purchases",
      "Signup-to-Purchase %",
      "Total Revenue ($)",
      "Status",
      "Created Date",
      "Notes",
    ];

    const rows = filteredLinks.map((l) => [
      `"${l.agencyName.replace(/"/g, '""')}"`,
      `"${l.code}"`,
      `"${baseUrl}/r/${l.code}"`,
      `"${l.targetUrl}"`,
      l.visitsCount,
      l.uniqueVisitsCount,
      l.signupsCount,
      `${l.conversionRateSignup || 0}%`,
      l.purchasesCount,
      `${l.conversionRatePurchase || 0}%`,
      l.totalRevenue.toFixed(2),
      l.isActive ? "Active" : "Paused",
      `"${new Date(l.createdAt).toLocaleDateString()}"`,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `britcrm-referral-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Referral report exported successfully");
  };

  return (
    <div className="space-y-8">
      {/* 1. Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Agencies */}
        <div className="p-5 rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#012169] to-blue-600 flex items-center justify-center mb-3">
            <Building className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{overview.totalAgencies}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Agencies / Links</p>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
              {overview.activeAgencies} Active
            </span>
          </div>
        </div>

        {/* Visits */}
        <div className="p-5 rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center mb-3">
            <MousePointerClick className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{overview.totalVisits.toLocaleString()}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-1">
            Total Visits ({overview.uniqueVisits.toLocaleString()} unique)
          </p>
        </div>

        {/* Signups */}
        <div className="p-5 rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mb-3">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{overview.totalSignups.toLocaleString()}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Total Signups</p>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
              {overview.overallSignupRate}% Conv
            </span>
          </div>
        </div>

        {/* Purchases */}
        <div className="p-5 rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{overview.totalPurchases.toLocaleString()}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Paid Purchases</p>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
              {overview.overallPurchaseRate}% Paid
            </span>
          </div>
        </div>

        {/* Revenue */}
        <div className="col-span-2 lg:col-span-1 p-5 rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c8102e] to-red-600 flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
            ${overview.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-1">Attributed Revenue</p>
        </div>
      </div>

      {/* 2. Controls & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by agency name, referral code, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#012169] text-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
            {(["all", "active", "paused"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  statusFilter === s
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent focus:outline-none text-zinc-800 dark:text-zinc-200"
            >
              <option value="visits">Most Visits</option>
              <option value="signups">Most Signups</option>
              <option value="purchases">Most Purchases</option>
              <option value="revenue">Highest Revenue</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {/* Export CSV */}
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl transition-all"
            title="Export referral links and metrics as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Create Button */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#012169] hover:bg-blue-900 text-white rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Agency Link</span>
          </button>
        </div>
      </div>

      {/* 3. Referral Links Table */}
      <div className="rounded-[24px] border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Agency & Code</th>
                <th className="px-4 py-4">Referral Link</th>
                <th className="px-4 py-4 text-center">Visits (Total / Unique)</th>
                <th className="px-4 py-4 text-center">Signups (Rate)</th>
                <th className="px-4 py-4 text-center">Purchases (Rate)</th>
                <th className="px-4 py-4 text-right">Revenue</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5 font-medium">
              {filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-zinc-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                        <Share2 className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200">No referral links found</p>
                      <p className="text-xs text-zinc-400">
                        Create your first referral link for marketing agencies to start tracking visits, signups, and client purchases.
                      </p>
                      <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#012169] text-white rounded-xl shadow-sm hover:bg-blue-900"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Agency Link</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLinks.map((link) => {
                  const fullUrl = `${baseUrl}/r/${link.code}`;
                  const isCopied = copiedId === link.id;

                  return (
                    <tr
                      key={link.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Agency Name & Code */}
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className="font-black text-zinc-900 dark:text-zinc-100 text-sm">
                            {link.agencyName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded">
                              {link.code}
                            </span>
                            {link.targetUrl && link.targetUrl !== "/" && (
                              <span className="text-[10px] text-zinc-400 font-mono">
                                -&gt; {link.targetUrl}
                              </span>
                            )}
                          </div>
                          {link.notes && (
                            <p className="text-[11px] text-zinc-400 truncate max-w-xs mt-1">
                              {link.notes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Referral URL with 1-click copy */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg select-all">
                            /r/{link.code}
                          </code>
                          <button
                            onClick={() => copyLink(link.code, link.id)}
                            className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
                            title="Copy full referral link"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
                            title="Open link in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Visits */}
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-black text-zinc-900 dark:text-zinc-100 text-base">
                            {link.visitsCount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-bold">
                            {link.uniqueVisitsCount.toLocaleString()} unique
                          </span>
                        </div>
                      </td>

                      {/* Signups */}
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-black text-zinc-900 dark:text-zinc-100 text-base">
                            {link.signupsCount.toLocaleString()}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              (link.conversionRateSignup || 0) > 0
                                ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "text-zinc-400"
                            }`}
                          >
                            {link.conversionRateSignup || 0}% rate
                          </span>
                        </div>
                      </td>

                      {/* Purchases */}
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-black text-zinc-900 dark:text-zinc-100 text-base">
                            {link.purchasesCount.toLocaleString()}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              (link.conversionRatePurchase || 0) > 0
                                ? "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300"
                                : "text-zinc-400"
                            }`}
                          >
                            {link.conversionRatePurchase || 0}% paid
                          </span>
                        </div>
                      </td>

                      {/* Revenue */}
                      <td className="px-4 py-4 text-right">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                          ${link.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggle(link)}
                          disabled={isPending}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                            link.isActive
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-200"
                              : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-300"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              link.isActive ? "bg-emerald-600" : "bg-zinc-400"
                            }`}
                          />
                          {link.isActive ? "Active" : "Paused"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openDetails(link)}
                            className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[#012169] dark:text-blue-300 font-bold text-xs transition-colors flex items-center gap-1.5"
                            title="View referred clients and analytics logs"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Clients</span>
                          </button>
                          <button
                            onClick={() => setEditTarget(link)}
                            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                            title="Edit link"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(link.id, link.agencyName)}
                            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-[#c8102e] transition-colors"
                            title="Delete link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CREATE LINK MODAL */}
      {isCreateOpen && (
        <CreateLinkModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={(newLink) => {
            setLinks((prev) => [newLink, ...prev]);
            setIsCreateOpen(false);
          }}
        />
      )}

      {/* 5. EDIT LINK MODAL */}
      {editTarget && (
        <EditLinkModal
          link={editTarget}
          isOpen={Boolean(editTarget)}
          onClose={() => setEditTarget(null)}
          onUpdated={(updatedLink) => {
            setLinks((prev) =>
              prev.map((l) => (l.id === updatedLink.id ? { ...l, ...updatedLink } : l))
            );
            setEditTarget(null);
          }}
        />
      )}

      {/* 6. DETAILS & CLIENTS BREAKDOWN MODAL */}
      {detailTarget && (
        <AgencyDetailModal
          link={detailTarget}
          isOpen={Boolean(detailTarget)}
          onClose={() => setDetailTarget(null)}
          clients={detailClients}
          visits={detailVisits}
          loading={detailLoading}
          tab={detailTab}
          setTab={setDetailTab}
          baseUrl={baseUrl}
        />
      )}
    </div>
  );
}

/* =========================================================================
   SUB-COMPONENTS: MODALS
   ========================================================================= */

function CreateLinkModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (link: ReferralLinkRecord) => void;
}) {
  const [agencyName, setAgencyName] = useState("");
  const [code, setCode] = useState("");
  const [targetUrl, setTargetUrl] = useState("/");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-fill code from agency name if empty
  const handleAgencyChange = (val: string) => {
    setAgencyName(val);
    if (!code) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setCode(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim() || !code.trim()) {
      toast.error("Agency name and code are required");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("agencyName", agencyName);
    formData.append("code", code);
    formData.append("targetUrl", targetUrl);
    formData.append("notes", notes);

    try {
      const res = await createReferralLinkAction(null, formData);
      if (res.success) {
        toast.success(`Referral link for "${agencyName}" created!`);
        // reload or construct temporary record
        const dummy: ReferralLinkRecord = {
          id: crypto.randomUUID(),
          agencyName,
          code,
          targetUrl,
          notes,
          isActive: true,
          visitsCount: 0,
          uniqueVisitsCount: 0,
          signupsCount: 0,
          purchasesCount: 0,
          totalRevenue: 0,
          createdBy: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          conversionRateSignup: 0,
          conversionRatePurchase: 0,
        };
        onCreated(dummy);
      } else {
        toast.error(res.error || "Failed to create link");
      }
    } catch {
      toast.error("Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#012169] flex items-center justify-center text-white">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Create Referral Link</h3>
              <p className="text-xs text-zinc-400">Generate a unique link for a partner or marketing agency</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Agency / Partner Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Growth Agency"
              value={agencyName}
              onChange={(e) => handleAgencyChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Referral Code / Slug *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400">/r/</span>
              <input
                type="text"
                required
                placeholder="apex-growth"
                value={code}
                onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                className="w-full pl-10 pr-3.5 py-2.5 font-mono rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169]"
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Visitors clicking this link will be tracked to this agency.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Destination Page
            </label>
            <input
              type="text"
              placeholder="/"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
            <div className="flex gap-2 mt-1.5">
              {["/", "/pricing", "/signup"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetUrl(preset)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    targetUrl === preset
                      ? "bg-blue-50 border-blue-200 text-[#012169] dark:bg-blue-950/40 dark:border-blue-800"
                      : "bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Campaign Notes & Contact
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Q4 Instagram campaign, contact: sarah@apex.com, 20% rev-share terms"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-[#012169] hover:bg-blue-900 text-white rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditLinkModal({
  link,
  isOpen,
  onClose,
  onUpdated,
}: {
  link: ReferralLinkRecord;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: Partial<ReferralLinkRecord> & { id: string }) => void;
}) {
  const [agencyName, setAgencyName] = useState(link.agencyName);
  const [code, setCode] = useState(link.code);
  const [targetUrl, setTargetUrl] = useState(link.targetUrl);
  const [notes, setNotes] = useState(link.notes || "");
  const [isActive, setIsActive] = useState(link.isActive);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("id", link.id);
    formData.append("agencyName", agencyName);
    formData.append("code", code);
    formData.append("targetUrl", targetUrl);
    formData.append("notes", notes);
    formData.append("isActive", isActive ? "true" : "false");

    try {
      const res = await updateReferralLinkAction(null, formData);
      if (res.success) {
        toast.success("Referral link updated");
        onUpdated({
          id: link.id,
          agencyName,
          code,
          targetUrl,
          notes,
          isActive,
        });
      } else {
        toast.error(res.error || "Failed to update link");
      }
    } catch {
      toast.error("Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#012169] to-blue-700 flex items-center justify-center text-white">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Edit Referral Link</h3>
              <p className="text-xs text-zinc-400">Modify details for {link.agencyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Agency Name
            </label>
            <input
              type="text"
              required
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Referral Code / Slug
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              className="w-full px-3.5 py-2.5 font-mono rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Destination URL
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Notes & Terms
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
          </div>

          <div className="flex items-center gap-3 py-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-[#012169] rounded"
              />
              <span>Campaign Active</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-[#012169] hover:bg-blue-900 text-white rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AgencyDetailModal({
  link,
  isOpen,
  onClose,
  clients,
  visits,
  loading,
  tab,
  setTab,
  baseUrl,
}: {
  link: ReferralLinkRecord;
  isOpen: boolean;
  onClose: () => void;
  clients: ReferredClientRecord[];
  visits: ReferralVisitDetail[];
  loading: boolean;
  tab: "clients" | "visits";
  setTab: (t: "clients" | "visits") => void;
  baseUrl: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-950/40">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-zinc-900 dark:text-zinc-50">{link.agencyName}</span>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                /r/{link.code}
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  link.isActive
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {link.isActive ? "Active" : "Paused"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Referral Link: <code className="text-blue-600 dark:text-blue-300">{baseUrl}/r/{link.code}</code>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Funnel Overview Strip */}
        <div className="grid grid-cols-4 gap-2 p-4 bg-zinc-100/60 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800">
          <div className="text-center p-2">
            <span className="text-xs text-zinc-400 font-bold uppercase block">Visits</span>
            <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">{link.visitsCount}</span>
            <span className="text-[10px] text-zinc-400 block font-bold">({link.uniqueVisitsCount} unique)</span>
          </div>
          <div className="text-center p-2 border-l border-zinc-200 dark:border-zinc-700">
            <span className="text-xs text-zinc-400 font-bold uppercase block">Signups</span>
            <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">{link.signupsCount}</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-bold">
              {link.conversionRateSignup || 0}% of visits
            </span>
          </div>
          <div className="text-center p-2 border-l border-zinc-200 dark:border-zinc-700">
            <span className="text-xs text-zinc-400 font-bold uppercase block">Purchases</span>
            <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">{link.purchasesCount}</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-bold">
              {link.conversionRatePurchase || 0}% of signups
            </span>
          </div>
          <div className="text-center p-2 border-l border-zinc-200 dark:border-zinc-700">
            <span className="text-xs text-zinc-400 font-bold uppercase block">Total Revenue</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              ${link.totalRevenue.toFixed(2)}
            </span>
            <span className="text-[10px] text-zinc-400 block font-bold">Attributed</span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 border-b border-zinc-200 dark:border-zinc-800 flex gap-4 bg-white dark:bg-zinc-900">
          <button
            onClick={() => setTab("clients")}
            className={`py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
              tab === "clients"
                ? "border-[#012169] text-[#012169] dark:border-blue-400 dark:text-blue-300"
                : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Referred Clients ({clients.length})</span>
          </button>
          <button
            onClick={() => setTab("visits")}
            className={`py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
              tab === "visits"
                ? "border-[#012169] text-[#012169] dark:border-blue-400 dark:text-blue-300"
                : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            <MousePointerClick className="w-4 h-4" />
            <span>Recent Click Traffic ({visits.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#012169]" />
            </div>
          ) : tab === "clients" ? (
            /* Clients Table */
            clients.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                <p className="font-bold text-zinc-700 dark:text-zinc-300">No client signups yet</p>
                <p className="text-xs">When users register through this agency's link, they will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Registered</th>
                      <th className="px-4 py-3">Subscription</th>
                      <th className="px-4 py-3 text-center">Purchases</th>
                      <th className="px-4 py-3 text-right">Revenue Contributed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {clients.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="px-4 py-3">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{c.name || "User"}</p>
                          <p className="text-xs text-zinc-400">{c.email}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500">
                          {new Date(c.signupDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            {c.plan} ({c.subscriptionStatus})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-zinc-800 dark:text-zinc-200">
                          {c.purchasesCount}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                          ${c.totalPaid.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* Traffic Visits Table */
            visits.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 space-y-2">
                <MousePointerClick className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                <p className="font-bold text-zinc-700 dark:text-zinc-300">No clicks recorded yet</p>
                <p className="text-xs">Clicks to this referral link will be logged here with referrer data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Landing Path</th>
                      <th className="px-4 py-3">Referrer</th>
                      <th className="px-4 py-3">Visitor ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono text-xs">
                    {visits.map((v) => (
                      <tr key={v.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="px-4 py-3 text-zinc-500 font-sans">
                          {new Date(v.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-blue-600 dark:text-blue-400">
                          {v.landingPath || "/"}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 truncate max-w-xs font-sans">
                          {v.referer || "Direct / Link Click"}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-[10px]">
                          {v.visitorId.slice(0, 12)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Created on {new Date(link.createdAt).toLocaleDateString()}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl hover:bg-zinc-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
