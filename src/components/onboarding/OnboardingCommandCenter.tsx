"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  FileText,
  FileSignature,
  CreditCard,
  Send,
  Check,
  X,
  Eye,
  Edit3,
  Copy,
  ExternalLink,
  ShieldCheck,
  Clock,
  Zap,
  ChevronRight,
  RefreshCw,
  FilePlus,
  Paperclip,
  Download,
  Trash2,
} from "lucide-react";
import {
  submitInternalDetailsAction,
  approveActionAction,
  rejectActionAction,
  approveAllActionsAction,
  updateDocumentContentAction,
  activateClientAction,
  previewDocumentAction,
  previewCommunicationAction,
  regenerateActionAction,
  resolveExceptionAction,
  getLiveAiSummaryAction,
  deleteCustomDocumentAction,
} from "@/app/onboarding/actions";
import AddCustomDocumentModal from "@/components/onboarding/AddCustomDocumentModal";

interface OnboardingCommandCenterProps {
  instance: any;
  internalQuestions: any[];
  auditEvents: any[];
  aiSummary: string;
  isAdmin?: boolean;
  userRole?: string;
}

export default function OnboardingCommandCenter({
  instance,
  internalQuestions,
  auditEvents,
  aiSummary: initialAiSummary,
  isAdmin = false,
  userRole = "USER",
}: OnboardingCommandCenterProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "approval" | "documents" | "responses" | "exceptions" | "summary" | "audit">("overview");
  const [aiSummary, setAiSummary] = useState(initialAiSummary);
  const [isRefreshingSummary, setIsRefreshingSummary] = useState(false);
  const [resolvingException, setResolvingException] = useState<any | null>(null);
  const [exceptionResolutionNotes, setExceptionResolutionNotes] = useState("");
  const [internalForm, setInternalForm] = useState<Record<string, any>>(() => {
    if (instance.commercialDetails) {
      try {
        return JSON.parse(instance.commercialDetails);
      } catch {}
    }
    const defaults: Record<string, any> = {};
    for (const q of internalQuestions) {
      defaults[q.key] = q.defaultValue || "";
    }
    return defaults;
  });

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewItem, setPreviewItem] = useState<{ title: string; content: string; fileUrl?: string | null } | null>(null);
  const [editingDoc, setEditingDoc] = useState<{ id: string; title: string; content: string } | null>(null);
  const [rejectPrompt, setRejectPrompt] = useState<{ actionId: string; description: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);

  const portalUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/onboarding/portal/${instance.secureToken}`;

  const copyPortalLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleInternalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("submitting_internal");
    try {
      await submitInternalDetailsAction(instance.id, internalForm);
      setActiveTab("approval");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApprove = async (actionId: string) => {
    setLoadingAction(actionId);
    try {
      await approveActionAction(actionId);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    if (!rejectPrompt) return;
    setLoadingAction(rejectPrompt.actionId);
    try {
      await rejectActionAction(rejectPrompt.actionId, rejectReason);
      setRejectPrompt(null);
      setRejectReason("");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApproveAll = async () => {
    setLoadingAction("approve_all");
    try {
      await approveAllActionsAction(instance.id);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSaveDocEdit = async () => {
    if (!editingDoc) return;
    setLoadingAction("saving_doc");
    try {
      await updateDocumentContentAction(editingDoc.id, editingDoc.content);
      setEditingDoc(null);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleActivate = async () => {
    setLoadingAction("activating");
    try {
      await activateClientAction(instance.id);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRegenerate = async (actionId: string) => {
    setLoadingAction(`regen_${actionId}`);
    try {
      await regenerateActionAction(actionId);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResolveException = async () => {
    if (!resolvingException) return;
    setLoadingAction(`resolve_${resolvingException.id}`);
    try {
      await resolveExceptionAction(resolvingException.id, exceptionResolutionNotes);
      setResolvingException(null);
      setExceptionResolutionNotes("");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRefreshAiSummary = async () => {
    setIsRefreshingSummary(true);
    try {
      const res = await getLiveAiSummaryAction(instance.id);
      if (res.success && res.summary) {
        setAiSummary(res.summary);
      }
    } finally {
      setIsRefreshingSummary(false);
    }
  };

  const pendingApprovals = instance.actions.filter((a: any) => a.status === "PENDING_APPROVAL");
  const openExceptions = (instance.exceptions || []).filter((e: any) => e.status === "OPEN");

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-28 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-[#012169] dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Onboarding Hub
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={copyPortalLink}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-200 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? "Link Copied!" : "Copy Client Portal Link"}
          </button>
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#012169] text-white text-xs font-black uppercase tracking-wider hover:bg-[#c8102e] transition-all shadow-sm cursor-pointer"
          >
            Open Client Portal <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Instance Header Card */}
      <div className="p-8 rounded-[36px] bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-white/5 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 border-b border-slate-100 dark:border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#012169] dark:text-blue-400">
                {instance.serviceName}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Owner: {instance.owner?.name || "Operations"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase mt-1">
              {instance.client.company || instance.client.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Primary Contact: {instance.client.name} &bull; {instance.client.email}
            </p>
          </div>

          {/* Health & Progress Indicator */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Health Status</p>
              <div>
                {instance.healthStatus === "HEALTHY" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                  </span>
                )}
                {instance.healthStatus === "AT_RISK" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5" /> At Risk
                  </span>
                )}
                {instance.healthStatus === "BLOCKED" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300">
                    <XCircle className="w-3.5 h-3.5" /> Blocked
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1 min-w-[140px]">
              <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <span>Progress</span>
                <span>{instance.progressPercentage}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#012169] dark:bg-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${instance.progressPercentage}%` }}
                />
              </div>
            </div>

            {instance.status === "READY_FOR_ACTIVATION" && (
              <button
                onClick={handleActivate}
                disabled={loadingAction === "activating"}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-xl cursor-pointer"
              >
                {loadingAction === "activating" ? "Activating..." : "Activate Client"}
              </button>
            )}
          </div>
        </div>

        {/* AI Operational Assistant Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/70 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 border border-blue-100 dark:border-blue-900/30 relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#012169] text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#012169] dark:text-blue-400">
                AI Operations Assistant
              </p>
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-200 leading-relaxed">
                {instance.status === "INITIALISING" || instance.status === "WAITING_INTERNAL_INFORMATION"
                  ? `${instance.client.company || instance.client.name} is ready for onboarding. I already have core contact & lead information. I need missing commercial details below before I can prepare agreements and invoices.`
                  : instance.status === "WAITING_HUMAN_APPROVAL"
                  ? `I have synthesized CRM context and commercial terms. I prepared ${instance.actions.length} actions (${pendingApprovals.length} require your approval). Review and approve them in the Approval Centre.`
                  : instance.status === "WAITING_CLIENT"
                  ? `Documents and communications have been approved. The client has received their secure onboarding link. Monitoring progressive answers and signature requests.`
                  : instance.status === "READY_FOR_ACTIVATION"
                  ? `All mandatory legal agreements have been signed, the invoice is recorded, and client responses are verified. Click 'Activate Client' to complete onboarding and launch active delivery.`
                  : `Client onboarding is completed! Client has been transitioned to active account delivery.`}
              </p>
            </div>
          </div>
        </div>

        {/* Active Exception Alert Banner (Section 22 & 24) */}
        {openExceptions.length > 0 && (
          <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200">
                    {openExceptions[0].severity}
                  </span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-red-900 dark:text-red-200">
                    🔴 Exception Detected ({openExceptions.length} Active)
                  </h4>
                </div>
                <p className="text-xs text-red-800 dark:text-red-300 mt-1 font-medium">
                  {openExceptions[0].description}
                </p>
                <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">
                  <strong className="uppercase">Recommended action:</strong> {openExceptions[0].recommendedAction}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setResolvingException(openExceptions[0])}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
              >
                Resolve
              </button>
              <button
                onClick={() => setActiveTab("exceptions")}
                className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-red-100 text-red-800 dark:text-white text-xs font-bold transition-all border border-red-200 dark:border-white/10 cursor-pointer"
              >
                View All ({openExceptions.length})
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pt-2 overflow-x-auto">
          {[
            { id: "overview", label: "Overview & Plan" },
            { id: "approval", label: `Approval Centre (${pendingApprovals.length})` },
            { id: "documents", label: `Documents & Signatures (${instance.documents.length})` },
            { id: "responses", label: `Client Responses (${instance.responses.length})` },
            { id: "exceptions", label: `Exceptions (${openExceptions.length})` },
            { id: "summary", label: "AI Summary" },
            { id: "audit", label: "Timeline & Audit" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? "border-[#012169] dark:border-blue-400 text-[#012169] dark:text-blue-300"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & INTERNAL QUESTIONING */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Internal Questions or Commercial Summary */}
          <div className="lg:col-span-2 space-y-6">
            {(!instance.commercialDetails || instance.status === "WAITING_INTERNAL_INFORMATION") ? (
              <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/5 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-slate-100 dark:border-white/5 pb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#012169]">Internal Step</span>
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1">
                    Missing Commercial & Project Information
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Please provide the agreed project parameters. AI will use these to populate the Service Agreement, NDA, Invoice, and Project Brief.
                  </p>
                </div>

                <form onSubmit={handleInternalSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {internalQuestions.map((q) => (
                      <div key={q.key} className={q.type === "textarea" ? "sm:col-span-2" : ""}>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-300 mb-1">
                          {q.label} {q.required && <span className="text-red-500">*</span>}
                        </label>

                        {q.type === "dropdown" ? (
                          <select
                            value={internalForm[q.key] || ""}
                            onChange={(e) => setInternalForm({ ...internalForm, [q.key]: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white"
                          >
                            {(q.options || []).map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : q.type === "textarea" ? (
                          <textarea
                            rows={3}
                            value={internalForm[q.key] || ""}
                            onChange={(e) => setInternalForm({ ...internalForm, [q.key]: e.target.value })}
                            placeholder={q.helpText || ""}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white"
                          />
                        ) : (
                          <input
                            type={q.type === "date" ? "date" : q.type === "currency" ? "number" : "text"}
                            value={internalForm[q.key] || ""}
                            onChange={(e) => setInternalForm({ ...internalForm, [q.key]: e.target.value })}
                            placeholder={q.helpText || ""}
                            required={q.required}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={loadingAction === "submitting_internal"}
                      className="bg-[#012169] hover:bg-[#c8102e] text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md cursor-pointer flex items-center gap-2"
                    >
                      {loadingAction === "submitting_internal" ? "Generating Onboarding Plan..." : "Generate AI Onboarding Plan"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/5 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#012169]">Commercial Terms</span>
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1">
                      Agreed Project Parameters
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      submitInternalDetailsAction(instance.id, internalForm);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#012169]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-sync Plan
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-black uppercase text-slate-400">Total Price</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                      £{Number(internalForm.price || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-black uppercase text-slate-400">Duration</p>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                      {internalForm.duration || "3 months"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-black uppercase text-slate-400">Estimated Kickoff</p>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                      {internalForm.startDate || "TBD"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-black uppercase text-slate-400">Deposit %</p>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                      {internalForm.advancePaymentPercent || "50%"}
                    </p>
                  </div>
                </div>

                {internalForm.specialConditions && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#012169] mb-1">Special Contractual Notes</p>
                    <p className="text-xs text-slate-700 dark:text-zinc-300">{internalForm.specialConditions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions summary card */}
            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/5 rounded-[32px] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Workstream Progress
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {instance.actions.filter((a: any) => a.status === "EXECUTED").length} of {instance.actions.length} Completed
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-black uppercase">Documents</span>
                  </div>
                  <p className="text-sm font-black mt-2">{instance.documents.length} Prepared</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase">Signatures</span>
                  </div>
                  <p className="text-sm font-black mt-2">
                    {instance.signatureRequests.filter((s: any) => s.status === "SIGNED").length} of {instance.signatureRequests.length} Signed
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase">Deposit Invoice</span>
                  </div>
                  <p className="text-sm font-black mt-2">{instance.invoiceStatus || "DRAFT"}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] font-black uppercase">Responses</span>
                  </div>
                  <p className="text-sm font-black mt-2">{instance.responses.length} Submitted</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI 360 Summary & Portal Card */}
          <div className="space-y-6">
            {/* Live AI Summary */}
            <div className="p-6 rounded-[32px] bg-gradient-to-br from-[#012169] to-indigo-950 text-white shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-200">
                  Live AI Onboarding Brief
                </h3>
              </div>
              <p className="text-xs font-medium text-slate-100 leading-relaxed whitespace-pre-line">
                {initialAiSummary}
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-bold text-blue-300">
                <span>Generated live from CRM state</span>
              </div>
            </div>

            {/* Client Portal Link Card */}
            <div className="p-6 rounded-[32px] bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Client Link
              </h3>
              <p className="text-xs text-slate-500">
                The client accesses their lightweight onboarding wizard using this encrypted token link:
              </p>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-[10px] font-mono break-all select-all">
                {portalUrl}
              </div>
              <button
                onClick={copyPortalLink}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-800 dark:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? "Link Copied!" : "Copy Onboarding Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI APPROVAL CENTRE */}
      {activeTab === "approval" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/60 p-6 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#012169]">Human Oversight Engine</span>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1">
                AI Approval Centre
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                AI has prepared these actions. Unapproved sensitive items cannot execute or contact the client until reviewed.
              </p>
            </div>

            {pendingApprovals.length > 0 && (
              <button
                onClick={handleApproveAll}
                disabled={loadingAction === "approve_all"}
                className="bg-[#012169] hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {loadingAction === "approve_all" ? "Approving All..." : `Approve All (${pendingApprovals.length})`}
              </button>
            )}
          </div>

          <div className="grid gap-4">
            {instance.actions.map((act: any) => {
              const payload = JSON.parse(act.payload || "{}");
              const isPending = act.status === "PENDING_APPROVAL";

              return (
                <div
                  key={act.id}
                  className={`p-6 rounded-[28px] border transition-all ${
                    isPending
                      ? "bg-white dark:bg-zinc-900/90 border-blue-200 dark:border-blue-900/40 shadow-md"
                      : "bg-slate-50/70 dark:bg-zinc-900/40 border-slate-200 dark:border-white/5 opacity-80"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            act.riskLevel === "CRITICAL"
                              ? "bg-red-100 text-red-700 dark:bg-red-950/50"
                              : act.riskLevel === "HIGH"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/50"
                          }`}
                        >
                          {act.riskLevel} Risk
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {act.actionType.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            act.status === "EXECUTED"
                              ? "bg-emerald-100 text-emerald-700"
                              : act.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {act.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {act.description}
                      </h4>
                      {act.executionResult && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          &bull; {act.executionResult}
                        </p>
                      )}
                      {act.rejectionReason && (
                        <p className="text-xs text-red-500 font-medium">
                          &bull; Rejected: {act.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                      {act.actionType === "GENERATE_DOCUMENT" && (
                        <>
                          <button
                            onClick={async () => {
                              const res = await previewDocumentAction(instance.id, payload.documentType);
                              if (res.success && res.title && res.content) {
                                setPreviewItem({ title: res.title, content: res.content });
                              }
                            }}
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Preview
                          </button>
                          {(() => {
                            const matchedDoc = instance.documents?.find((d: any) => d.documentType === payload.documentType);
                            if (matchedDoc && matchedDoc.versions?.[0]) {
                              return (
                                <button
                                  onClick={() => setEditingDoc({
                                    id: matchedDoc.id,
                                    title: matchedDoc.title,
                                    content: matchedDoc.versions[0].content,
                                  })}
                                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Edit
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </>
                      )}

                      {act.actionType === "GENERATE_COMMUNICATION" && (
                        <button
                          onClick={async () => {
                            const res = await previewCommunicationAction(instance.id, payload.type || "WELCOME");
                            if (res.success && res.title && res.content) {
                              setPreviewItem({ title: res.title, content: res.content });
                            }
                          }}
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview Email
                        </button>
                      )}

                      {act.actionType === "SEND_CUSTOM_DOCUMENT" && (
                        <button
                          onClick={async () => {
                            const res = await previewDocumentAction(instance.id, payload.documentId || payload.title);
                            if (res.success && res.title && res.content) {
                              setPreviewItem({ title: res.title, content: res.content, fileUrl: res.fileUrl || payload.fileUrl });
                            }
                          }}
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview Custom Document
                        </button>
                      )}

                      {/* Regenerate Action (Section 10 & 37) */}
                      <button
                        onClick={() => handleRegenerate(act.id)}
                        disabled={loadingAction === `regen_${act.id}`}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-blue-50 text-slate-700 dark:text-zinc-300 hover:text-blue-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        title="Regenerate this action proposal"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === `regen_${act.id}` ? "animate-spin" : ""}`} />
                        Regenerate
                      </button>

                      {isPending && (
                        <>
                          <button
                            onClick={() => setRejectPrompt({ actionId: act.id, description: act.description })}
                            className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                          <button
                            onClick={() => handleApprove(act.id)}
                            disabled={loadingAction === act.id}
                            className="px-5 py-2.5 rounded-xl bg-[#012169] hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> {loadingAction === act.id ? "Executing..." : "Approve"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {instance.actions.length === 0 && (
              <div className="p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/5">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  No actions generated yet. Please supply missing commercial details in the Overview tab.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENTS & SIGNATURES */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#012169] dark:text-blue-400">
                  Document Repository
                </span>
                {!isAdmin ? (
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#012169] dark:text-blue-300">
                    User Mode &bull; Custom Files Allowed
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    Admin Access &bull; Full Blueprint Control
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Contracts, Files & Digital Signatures
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Generated contracts, custom client files, and manual templates. All new documents must be approved before being sent to the client.
              </p>
            </div>

            <button
              onClick={() => setIsAddDocOpen(true)}
              className="bg-[#012169] hover:bg-[#c8102e] text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-center"
            >
              <FilePlus className="w-4 h-4" /> Add Document / File
            </button>
          </div>

          <div className="grid gap-4">
            {instance.documents.map((doc: any) => {
              const sigReq = instance.signatureRequests.find((s: any) => s.documentId === doc.id);
              const latestVer = doc.versions?.[0];
              const isPending = doc.status === "PENDING_APPROVAL";

              return (
                <div
                  key={doc.id}
                  className={`p-6 rounded-[28px] border transition-all space-y-4 ${
                    isPending
                      ? "bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30 shadow-sm"
                      : "bg-white dark:bg-zinc-900/60 border-slate-200 dark:border-white/5 shadow-sm"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#012169] dark:text-blue-400">
                          {doc.documentType.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Version {latestVer?.versionNumber || 1}
                        </span>
                        {isPending && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending Approval (Not Sent)
                          </span>
                        )}
                        {doc.status === "APPROVED" && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                            Approved
                          </span>
                        )}
                        {doc.status === "SENT" && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                            Sent to Client
                          </span>
                        )}
                        {doc.status === "SIGNED" && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-700">
                            Signed
                          </span>
                        )}
                        {doc.status === "REJECTED" && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-red-700">
                            Rejected
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                        {doc.title}
                      </h3>

                      {latestVer?.fileUrl && (
                        <div className="pt-2">
                          <a
                            href={latestVer.fileUrl}
                            download={doc.title}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition-colors"
                          >
                            <Paperclip className="w-3.5 h-3.5" /> Attached File (Download / View)
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewItem({ title: doc.title, content: latestVer?.content || "", fileUrl: latestVer?.fileUrl })}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={() => setEditingDoc({ id: doc.id, title: doc.title, content: latestVer?.content || "" })}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Content
                      </button>
                      {isPending && (
                        <button
                          onClick={async () => {
                            if (confirm(`Remove custom document "${doc.title}"?`)) {
                              await deleteCustomDocumentAction(doc.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold cursor-pointer"
                          title="Delete unapproved document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isPending && (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        <strong>Approval Gate Active:</strong> This custom document is held in draft. It will NOT be dispatched to the client portal or sent until approved in the Approval Centre.
                      </span>
                    </div>
                  )}

                  {sigReq && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <FileSignature className="w-5 h-5 text-indigo-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                            Digital Execution Status: <strong className="uppercase">{sigReq.status}</strong>
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Signatory: {sigReq.signatories?.[0]?.name || instance.client.name} ({sigReq.signatories?.[0]?.email})
                          </p>
                        </div>
                      </div>
                      {sigReq.status === "SIGNED" && sigReq.auditCertificate && (
                        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-xl">
                          ✔ Verified Digital Audit Certificate
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {instance.documents.length === 0 && (
              <div className="p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/5">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  No documents generated yet. Approve document actions in the Approval Centre to generate contracts.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CLIENT RESPONSES */}
      {activeTab === "responses" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Client Portal Submissions
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Information collected through the client&apos;s mobile onboarding link using progressive questioning.
            </p>
          </div>

          <div className="grid gap-3">
            {instance.responses.map((resp: any) => (
              <div
                key={resp.id}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/5 shadow-sm flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {resp.questionLabel}
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {resp.response}
                  </p>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  {new Date(resp.submittedAt).toLocaleString("en-GB")}
                </span>
              </div>
            ))}

            {instance.responses.length === 0 && (
              <div className="p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/5">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Client has not yet submitted responses through the onboarding link.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: EXCEPTIONS (Section 22 & 24) */}
      {activeTab === "exceptions" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Proactive Monitoring</span>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1">
                Onboarding Exception Management
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                AI continuously monitors deadlines, signatures, payments, and client responses to surface risks and exceptions for human intervention.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {(instance.exceptions || []).map((ex: any) => {
              const isOpen = ex.status === "OPEN";
              return (
                <div
                  key={ex.id}
                  className={`p-6 rounded-[28px] border transition-all ${
                    isOpen
                      ? "bg-white dark:bg-zinc-900 border-red-200 dark:border-red-900/40 shadow-sm"
                      : "bg-slate-50/70 dark:bg-zinc-900/40 border-slate-200 dark:border-white/5 opacity-75"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            ex.severity === "CRITICAL"
                              ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                              : ex.severity === "HIGH"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                          }`}
                        >
                          {ex.severity} Severity
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {ex.type.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            isOpen
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {ex.status}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {ex.description}
                      </h4>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-white/5 text-xs text-slate-700 dark:text-zinc-300">
                        <strong className="text-[#012169] dark:text-blue-400 uppercase text-[10px]">AI Recommended Action: </strong>
                        {ex.recommendedAction}
                      </div>
                      {ex.resolutionNotes && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          &bull; Resolution: {ex.resolutionNotes}
                        </p>
                      )}
                    </div>

                    <div className="self-end md:self-center shrink-0">
                      {isOpen && (
                        <button
                          onClick={() => {
                            setResolvingException(ex);
                            setExceptionResolutionNotes("");
                          }}
                          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                        >
                          Resolve Exception
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {(!instance.exceptions || instance.exceptions.length === 0) && (
              <div className="p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/5 bg-emerald-50/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-black text-slate-800 dark:text-white">
                  Zero Active Exceptions
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Onboarding workflow is progressing smoothly without commercial, legal, or response blockers.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: LIVE AI SUMMARY (Section 35) */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#012169]">Live CRM Intelligence</span>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1">
                Client Onboarding Summary
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Live executive brief synthesized directly from real-time CRM state, signed documents, invoices, and client responses.
              </p>
            </div>
            <button
              onClick={handleRefreshAiSummary}
              disabled={isRefreshingSummary}
              className="px-5 py-2.5 rounded-xl bg-[#012169] hover:bg-blue-800 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingSummary ? "animate-spin" : ""}`} />
              {isRefreshingSummary ? "Generating..." : "Refresh Summary"}
            </button>
          </div>

          <div className="p-8 rounded-[32px] bg-gradient-to-br from-[#012169] via-indigo-950 to-slate-950 text-white shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-black uppercase tracking-widest text-blue-200">
                  Client 360 Onboarding Intelligence
                </h3>
              </div>
              <span className="text-[10px] font-bold text-blue-300">
                Instance: {instance.id.slice(-8)}
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 font-mono text-sm leading-relaxed whitespace-pre-line text-blue-50">
              {aiSummary}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-blue-200">
              <span>Onboarding Health: <strong className="uppercase text-white">{instance.healthStatus}</strong></span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(aiSummary);
                  alert("AI Summary copied to clipboard!");
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Immutable Audit History
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Complete chronological audit trail recording all AI preparations, human approvals, client actions, and activations.
            </p>
          </div>

          <div className="space-y-3">
            {auditEvents.map((evt: any) => (
              <div
                key={evt.id}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/5 shadow-sm flex items-start justify-between gap-4 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-200">
                      {evt.actorType}
                    </span>
                    <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      {evt.action.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-300 font-medium">{evt.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {new Date(evt.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-medium">
                    {new Date(evt.createdAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[32px] p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                {previewItem.title}
              </h3>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-zinc-300 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 font-mono text-xs whitespace-pre-line text-slate-800 dark:text-zinc-200 leading-relaxed">
              {previewItem.content}
            </div>
            {previewItem.fileUrl && (
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#012169] dark:text-blue-300">
                  <Paperclip className="w-4 h-4" /> Attached File
                </div>
                <a
                  href={previewItem.fileUrl}
                  download={previewItem.title}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-1.5 rounded-xl bg-[#012169] hover:bg-[#c8102e] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download / View File
                </a>
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-6 py-2.5 rounded-xl bg-[#012169] text-white text-xs font-black uppercase tracking-wider"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DOCUMENT CONTENT MODAL */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[32px] p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#012169]">Edit Agreement</span>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  {editingDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={16}
              value={editingDoc.content}
              onChange={(e) => setEditingDoc({ ...editingDoc, content: e.target.value })}
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 font-mono text-xs text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#012169]"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingDoc(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDocEdit}
                disabled={loadingAction === "saving_doc"}
                className="px-6 py-2.5 rounded-xl bg-[#012169] text-white text-xs font-black uppercase tracking-wider"
              >
                {loadingAction === "saving_doc" ? "Saving..." : "Save New Version"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT PROMPT MODAL */}
      {rejectPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black uppercase text-slate-900 dark:text-white">
              Reject Action: {rejectPrompt.description}
            </h3>
            <p className="text-xs text-slate-500">
              Please enter the reason for rejecting this action. This will be recorded in the audit trail.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Needs pricing adjustment or alternative signatory"
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectPrompt(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-wider"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESOLVE EXCEPTION MODAL (Section 24) */}
      {resolvingException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Exception Resolution</span>
              <h3 className="text-base font-black uppercase text-slate-900 dark:text-white mt-0.5">
                Resolve: {resolvingException.type.replace(/_/g, " ")}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300">
              {resolvingException.description}
            </p>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">
                Document Resolution Notes (Audit Recorded)
              </label>
              <textarea
                rows={3}
                value={exceptionResolutionNotes}
                onChange={(e) => setExceptionResolutionNotes(e.target.value)}
                placeholder="e.g. Spoke with client CFO, payment transferred directly via BACS; verified in bank feed."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setResolvingException(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveException}
                disabled={loadingAction === `resolve_${resolvingException.id}`}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all"
              >
                {loadingAction === `resolve_${resolvingException.id}` ? "Resolving..." : "Mark Resolved"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM DOCUMENT & MANUAL FILE MODAL */}
      <AddCustomDocumentModal
        isOpen={isAddDocOpen}
        onClose={() => setIsAddDocOpen(false)}
        onboardingId={instance.id}
        clientName={instance.client.name}
        clientEmail={instance.client.email}
      />
    </div>
  );
}
