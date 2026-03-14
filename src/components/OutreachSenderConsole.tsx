"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Mail, Send, BarChart3, Users, RefreshCw } from "lucide-react";
import Link from "next/link";

type EmailAccount = {
  id: string;
  email: string;
};

type LeadCategoryOption = {
  id: string;
  name: string;
  leadCount: number;
};

type LeadStatusOption = {
  status: string;
  count: number;
};

type AccountAnalytics = {
  rawCounts: {
    sent: number;
    delivered: number;
    bounced: number;
    uniqueOpens: number;
    replies?: number;
  };
  metrics: {
    deliveryRate: string;
    bounceRate: string;
    openRate: string;
    replyRate?: string;
  };
};

type CampaignHistory = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  counts: {
    sent: number;
    delivered: number;
    bounced: number;
    opens: number;
    replies: number;
  };
  metrics: {
    deliveryRate: number;
    openRate: number;
    replyRate: number;
  };
};

const defaultAnalytics: AccountAnalytics = {
  rawCounts: { sent: 0, delivered: 0, bounced: 0, uniqueOpens: 0, replies: 0 },
  metrics: { deliveryRate: "0.0%", bounceRate: "0.0%", openRate: "0.0%", replyRate: "0.0%" },
};

export default function OutreachSenderConsole() {
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [analytics, setAnalytics] = useState<AccountAnalytics>(defaultAnalytics);
  const [history, setHistory] = useState<CampaignHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leadCategories, setLeadCategories] = useState<LeadCategoryOption[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatusOption[]>([]);

  const [campaignName, setCampaignName] = useState("");
  const [senderName, setSenderName] = useState("BritCRM Outreach");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("<p>Hi {{FirstName}},</p><p>I wanted to quickly reach out.</p>");
  const [recipients, setRecipients] = useState("");
  const [smtpAccountIds, setSmtpAccountIds] = useState<string[]>([]);
  const [recipientSource, setRecipientSource] = useState<"MANUAL" | "LEADS" | "BOTH">("MANUAL");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [selectedLeadStatus, setSelectedLeadStatus] = useState<string>("ALL");

  const recipientCount = useMemo(() => {
    const items = recipients
      .split(/[\n,;]+/)
      .map((v) => v.trim().toLowerCase())
      .filter((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
    return new Set(items).size;
  }, [recipients]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [accRes, analyticsRes, historyRes] = await Promise.all([
        fetch("/api/email-accounts"),
        fetch("/api/outreach/analytics/account"),
        fetch("/api/outreach/campaigns"),
      ]);
      const leadOptionsRes = await fetch("/api/outreach/leads/options");

      if (!accRes.ok) throw new Error("Failed to load sender accounts.");
      if (!analyticsRes.ok) throw new Error("Failed to load account analytics.");
      if (!historyRes.ok) throw new Error("Failed to load campaign history.");
      if (!leadOptionsRes.ok) throw new Error("Failed to load lead targeting options.");

      const accountsData = await accRes.json();
      const analyticsData = await analyticsRes.json();
      const historyData = await historyRes.json();
      const leadOptionsData = await leadOptionsRes.json();

      setEmailAccounts(Array.isArray(accountsData) ? accountsData : []);
      setAnalytics(analyticsData || defaultAnalytics);
      setHistory(Array.isArray(historyData?.history) ? historyData.history : []);
      setLeadCategories(Array.isArray(leadOptionsData?.categories) ? leadOptionsData.categories : []);
      setLeadStatuses(Array.isArray(leadOptionsData?.statuses) ? leadOptionsData.statuses : []);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load outreach console.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onToggleAccount = (id: string) => {
    setSmtpAccountIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const onImportRecipientFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const emails = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
      const unique = Array.from(new Set(emails.map((e) => e.trim().toLowerCase())));
      if (unique.length === 0) {
        toast.error("No valid email addresses found in file.");
        return;
      }
      const current = recipients
        .split(/[\n,;]+/)
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean);
      const merged = Array.from(new Set([...current, ...unique]));
      setRecipients(merged.join("\n"));
      toast.success(`Imported ${unique.length} emails from file.`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to read file.");
    }
  };

  const onLaunchCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const useManualRecipients = recipientSource !== "LEADS";
    const useLeadPool = recipientSource !== "MANUAL";

    if (!campaignName.trim() || !subject.trim() || !htmlContent.trim()) {
      toast.error("Campaign name, subject and message are required.");
      return;
    }
    if (useManualRecipients && recipientCount < 1 && !useLeadPool) {
      toast.error("Add recipient emails.");
      return;
    }
    if (useManualRecipients && recipientCount < 1 && useLeadPool) {
      toast.error("Add manual recipients or choose leads filters.");
      return;
    }
    if (smtpAccountIds.length < 1) {
      toast.error("Select at least one sender account.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/outreach/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          senderName,
          subject,
          htmlContent,
          recipients,
          includeManualRecipients: useManualRecipients,
          leadFilters: {
            enabled: useLeadPool,
            categoryIds: selectedCategoryId === "ALL" ? [] : [selectedCategoryId],
            includeStatuses: selectedLeadStatus === "ALL" ? [] : [selectedLeadStatus],
            excludeStatuses: [],
          },
          smtpAccountIds,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to launch campaign.");

      toast.success(`Campaign queued for ${data?.totalRecipients || recipientCount} recipients.`);
      setCampaignName("");
      setSubject("");
      setRecipients("");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to launch campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#012169]">Outreach Sender</h1>
            <p className="mt-1 text-sm text-zinc-600">Launch campaigns, rotate sender accounts, and monitor deliverability.</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: "Sent", value: analytics.rawCounts.sent, icon: Send, accent: "text-[#012169]" },
          { label: "Delivered", value: analytics.rawCounts.delivered, icon: Mail, accent: "text-green-700" },
          { label: "Opens", value: analytics.rawCounts.uniqueOpens, icon: BarChart3, accent: "text-[#c8102e]" },
          { label: "Replies", value: analytics.rawCounts.replies || 0, icon: Users, accent: "text-zinc-900" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{item.label}</p>
              <item.icon className={`h-5 w-5 ${item.accent}`} />
            </div>
            <p className="mt-3 text-3xl font-black text-zinc-900">{item.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <form onSubmit={onLaunchCampaign} className="xl:col-span-3 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-black uppercase text-[#012169]">Launch Campaign</h2>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-700">Recipient Source</p>
            <select
              value={recipientSource}
              onChange={(e) => setRecipientSource(e.target.value as "MANUAL" | "LEADS" | "BOTH")}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-[#012169] focus:ring-2"
            >
              <option value="MANUAL">Manual Emails (Textarea / CSV)</option>
              <option value="LEADS">Leads Category + Role</option>
              <option value="BOTH">Manual + Leads Category + Role</option>
            </select>

            {recipientSource !== "MANUAL" && (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-600">Lead Category</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-[#012169] focus:ring-2"
                  >
                    <option value="ALL">All Categories</option>
                    {leadCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.leadCount})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-600">Lead Role / Status</label>
                  <select
                    value={selectedLeadStatus}
                    onChange={(e) => setSelectedLeadStatus(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-[#012169] focus:ring-2"
                  >
                    <option value="ALL">All Roles</option>
                    {leadStatuses.map((item) => (
                      <option key={item.status} value={item.status}>
                        {item.status} ({item.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-600">Campaign Name</label>
              <input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Q2 UK SaaS Outreach"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-[#012169] focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-600">Sender Name</label>
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="BritCRM Team"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-[#012169] focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-600">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Quick idea for your team"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-[#012169] focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-600">HTML Message</label>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-[#012169] focus:ring-2 font-mono"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-600">Recipients</label>
            <textarea
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              rows={8}
              placeholder={"name@company.com\nsecond@company.com"}
              disabled={recipientSource === "LEADS"}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-[#012169] focus:ring-2"
            />
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">Valid unique recipients: {recipientCount}</p>
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                  Import CSV/TXT
                  <input
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => void onImportRecipientFile(e.target.files?.[0])}
                    disabled={recipientSource === "LEADS"}
                  />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">Sender Accounts</label>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSmtpAccountIds(emailAccounts.map((a) => a.id))}
                className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Select All SMTP
              </button>
              <button
                type="button"
                onClick={() => setSmtpAccountIds([])}
                className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Clear SMTP
              </button>
              <Link
                href="/settings/email"
                className="rounded-lg border border-[#012169] px-3 py-1 text-xs font-semibold text-[#012169] hover:bg-blue-50"
              >
                Add / Manage SMTP Accounts
              </Link>
            </div>
            {emailAccounts.length === 0 && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">No email accounts found. Add sender accounts first.</p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {emailAccounts.map((account) => (
                <label key={account.id} className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={smtpAccountIds.includes(account.id)}
                    onChange={() => onToggleAccount(account.id)}
                    className="h-4 w-4 accent-[#012169]"
                  />
                  <span>{account.email}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#012169] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#c8102e] disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Launching..." : "Launch Campaign"}
          </button>
        </form>

        <div className="xl:col-span-2 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black uppercase text-[#012169]">Campaign History</h2>
          <div className="mt-4 space-y-3 max-h-[800px] overflow-auto pr-1">
            {history.map((campaign) => (
              <div key={campaign.id} className="rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-zinc-900">{campaign.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${campaign.status === "Active" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"}`}>
                    {campaign.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{new Date(campaign.createdAt).toLocaleString()}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-zinc-50 p-2">
                    <p className="text-[10px] font-bold uppercase text-zinc-500">Sent</p>
                    <p className="text-sm font-black">{campaign.counts.sent}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-2">
                    <p className="text-[10px] font-bold uppercase text-zinc-500">Open %</p>
                    <p className="text-sm font-black">{campaign.metrics.openRate.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-2">
                    <p className="text-[10px] font-bold uppercase text-zinc-500">Reply %</p>
                    <p className="text-sm font-black">{campaign.metrics.replyRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
            {!loading && history.length === 0 && (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
                No campaigns yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
