"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Shield,
  FileText,
  Check,
  Plus,
  Sliders,
  Trash2,
  FileSignature,
  Bookmark,
  Sparkles,
  Lock,
  User,
  Layers,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  createCustomTemplateAction,
  deleteCustomTemplateAction,
} from "@/app/onboarding/actions";
import AIPermissionMatrixEditor from "@/components/onboarding/AIPermissionMatrixEditor";

interface TemplateStudioClientProps {
  isAdmin: boolean;
  systemServiceTemplates: any[];
  systemDocTemplates: any[];
  permissions: any[];
  initialCustomTemplates: any[];
}

export default function TemplateStudioClient({
  isAdmin,
  systemServiceTemplates,
  systemDocTemplates,
  permissions,
  initialCustomTemplates,
}: TemplateStudioClientProps) {
  const [activeTab, setActiveTab] = useState<"custom" | "system">(
    isAdmin ? "system" : "custom"
  );
  const [customTemplates, setCustomTemplates] = useState<any[]>(
    initialCustomTemplates || []
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [templateName, setTemplateName] = useState("");
  const [documentType, setDocumentType] = useState("CUSTOM_AGREEMENT");
  const [requiresSignature, setRequiresSignature] = useState(true);
  const [content, setContent] = useState("");

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!templateName.trim()) {
      setErrorMessage("Please enter a template name.");
      return;
    }
    if (!content.trim()) {
      setErrorMessage("Please enter document content or body text.");
      return;
    }

    startTransition(async () => {
      const res = await createCustomTemplateAction({
        name: templateName.trim(),
        content: content.trim(),
        requiresSignature,
      });

      if (res.success && res.template) {
        setCustomTemplates((prev) => [res.template, ...prev]);
        setSuccessMessage(`Custom template "${templateName.trim()}" created successfully!`);
        setIsCreateModalOpen(false);
        setTemplateName("");
        setContent("");
        setRequiresSignature(true);
      } else {
        setErrorMessage(res.error || "Failed to create custom template.");
      }
    });
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the custom template "${name}"?`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteCustomTemplateAction(id);
      if (res.success) {
        setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
        setSuccessMessage(`Template "${name}" deleted.`);
      } else {
        setErrorMessage(res.error || "Failed to delete template.");
      }
    });
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-24 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-[#012169] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Onboarding Hub
        </Link>

        <button
          onClick={() => {
            setErrorMessage(null);
            setSuccessMessage(null);
            setIsCreateModalOpen(true);
          }}
          className="bg-[#012169] hover:bg-[#c8102e] text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Custom Template
        </button>
      </div>

      {/* Header Banner */}
      <div>
        <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#012169] dark:text-blue-400">
          <Sliders className="w-3.5 h-3.5" />
          {isAdmin ? "Admin Template & Engine Control" : "Custom Templates Studio"}
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase">
          {isAdmin
            ? "Service Templates & Document Blueprint Studio"
            : "My Custom Document Templates"}
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          {isAdmin
            ? "Configure global onboarding logic per service offering and manage custom user templates. System blueprints are strictly visible to admins."
            : "Create and manage your own custom onboarding documents, contracts, and proposals. All custom documents require human review before dispatch."}
        </p>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Role Navigation Tabs (Admins Only) */}
      {isAdmin && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("system")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "system"
                ? "bg-[#012169] text-white shadow-sm"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" /> System Engine Blueprints (Admin Only)
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "custom"
                ? "bg-[#012169] text-white shadow-sm"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-blue-400" /> Custom User Templates ({customTemplates.length})
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CUSTOM TEMPLATES VIEW (Visible to ALL, Default for Normal Users)       */}
      {/* ========================================================================= */}
      {(!isAdmin || activeTab === "custom") && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#012169]" /> Custom Reusable Templates ({customTemplates.length})
              </h2>
              <p className="text-xs text-slate-400">
                Templates created here can be reused across any client onboarding instance.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-[#012169] hover:text-white text-slate-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Template
            </button>
          </div>

          {customTemplates.length === 0 ? (
            <div className="p-12 text-center rounded-[32px] bg-white dark:bg-zinc-900/60 border-2 border-dashed border-slate-200 dark:border-white/10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#012169] dark:text-blue-300 mx-auto flex items-center justify-center">
                <Bookmark className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  No Custom Templates Yet
                </h3>
                <p className="text-xs text-slate-500">
                  You haven&rsquo;t created any custom templates. Create reusable contracts, proposals, NDAs, and onboarding briefs tailored to your services.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#012169] hover:bg-[#c8102e] text-white text-xs font-black uppercase tracking-wider transition-all shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Your First Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-6 rounded-[28px] bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/5 shadow-sm space-y-4 flex flex-col justify-between hover:border-[#012169]/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#012169] dark:text-blue-300">
                        Custom
                      </span>
                      {tpl.requiresSignature && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 flex items-center gap-1">
                          <FileSignature className="w-3 h-3" /> Signature Required
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2">
                      {tpl.name}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-3 font-mono bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                      {tpl.content || "No content specified"}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Requires Human Review
                    </span>
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Delete Custom Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SYSTEM ENGINE BLUEPRINTS VIEW (STRICTLY ADMIN ONLY)                   */}
      {/* ========================================================================= */}
      {isAdmin && activeTab === "system" && (
        <div className="space-y-10 animate-in fade-in duration-200">
          {/* Admin Guard Notice */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <p className="font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">
                Admin-Restricted System Blueprints
              </p>
              <p className="text-amber-700 dark:text-amber-300 font-medium mt-0.5">
                These default service blueprints and document templates are hardcoded system logic. Normal users cannot see or access these system templates; they can only add and manage their own custom templates.
              </p>
            </div>
          </div>

          {/* Service Templates Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#012169]" /> Service Onboarding Templates ({systemServiceTemplates.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systemServiceTemplates.map((tpl: any) => {
                const docs = JSON.parse(tpl.requiredDocumentsJson || "[]");
                const sigs = JSON.parse(tpl.requiredSignaturesJson || "[]");
                const payment = JSON.parse(tpl.paymentRequirementsJson || "{}");

                return (
                  <div
                    key={tpl.id}
                    className="p-6 rounded-[32px] bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/5 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[#012169] dark:text-blue-300">
                          {tpl.code}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {tpl.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Required Docs:</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-300">{docs.length} templates</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Digital Signatures:</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-300">{sigs.join(", ") || "None"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Upfront Deposit:</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-300">{payment.advancePercent || 50}% ({payment.terms || "Net 14"})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Approved Document Blueprints Section */}
          <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-white/5">
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#012169]" /> Approved Document Templates ({systemDocTemplates.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {systemDocTemplates.map((doc: any) => {
                const vars = JSON.parse(doc.variablesJson || "[]");

                return (
                  <div
                    key={doc.id}
                    className="p-6 rounded-[28px] bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#012169] dark:text-blue-300">
                        {doc.type}
                      </span>
                      {doc.requiresSignature && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                          Signature Required
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {doc.name}
                    </h3>
                    <div className="text-[10px] text-slate-400 space-y-1">
                      <p className="font-medium">Variables: {vars.map((v: string) => `{{${v}}}`).join(", ")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Permission Matrix Section */}
          {permissions && permissions.length > 0 && (
            <div className="pt-6 border-t border-slate-200 dark:border-white/5">
              <AIPermissionMatrixEditor initialPermissions={permissions} />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CREATE CUSTOM TEMPLATE MODAL (Available to all users)                 */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[32px] w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#012169] dark:text-blue-400 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" /> Reusable Custom Template
                </span>
                <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white mt-0.5">
                  Create New Template
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-5">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Standard Client Services Agreement, Custom NDA"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Document Type / Category
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
                >
                  <option value="CUSTOM_AGREEMENT">Custom Services Agreement / Contract</option>
                  <option value="SCOPE_ADDENDUM">Statement of Work (SOW) / Scope Addendum</option>
                  <option value="NDA_CUSTOM">Non-Disclosure Agreement (NDA)</option>
                  <option value="TECHNICAL_SPEC">Technical Specification & Architecture</option>
                  <option value="WELCOME_CUSTOM">Custom Welcome Letter / Kickoff Brief</option>
                  <option value="COMPLIANCE_ATTACHMENT">Compliance / Regulatory Undertaking</option>
                  <option value="OTHER">Other Custom Template</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Template Content (Markdown / Plaintext) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Supports &#123;&#123;client_name&#125;&#125;, &#123;&#123;company&#125;&#125;, &#123;&#123;service_name&#125;&#125;
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# Master Service Agreement&#10;&#10;This Agreement is entered into between BritSync and {{company}} ({{client_name}})...&#10;&#10;### Scope of Services&#10;1. Deliverables...&#10;2. Payment terms..."
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                    <FileSignature className="w-4 h-4 text-indigo-600" /> Require Digital Signature by Default
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    When attached to an onboarding, prompts client for e-signature.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requiresSignature}
                  onChange={(e) => setRequiresSignature(e.target.checked)}
                  className="w-5 h-5 accent-[#012169] rounded cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Human Oversight:</strong> Whenever you generate or dispatch a document from this template, an admin review gate will be created before sending.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-[#012169] hover:bg-[#c8102e] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending ? "Creating..." : "Save Custom Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
