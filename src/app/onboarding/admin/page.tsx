import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings, Shield, FileText, Check, Plus, Sliders } from "lucide-react";
import { listServiceTemplates } from "@/lib/onboarding/service-templates";
import { ensureDocumentTemplates } from "@/lib/onboarding/document-templates";

export const dynamic = "force-dynamic";

export default async function OnboardingAdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await ensureDocumentTemplates();
  const templates = await listServiceTemplates();
  const docTemplates = await prisma.documentTemplate.findMany({
    orderBy: { type: "asc" },
  });

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto pb-24 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-[#012169] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Onboarding Hub
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#012169]">
          <Sliders className="w-3.5 h-3.5" /> Engine Configuration
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase">
          Service Templates & Document Blueprint Studio
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure onboarding logic per service offering. Add new services without modifying code.
        </p>
      </div>

      {/* Service Templates Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#012169]" /> Service Onboarding Templates ({templates.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => {
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
          <FileText className="w-4 h-4 text-[#012169]" /> Approved Document Templates ({docTemplates.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {docTemplates.map((doc) => {
            const vars = JSON.parse(doc.variablesJson || "[]");

            return (
              <div
                key={doc.id}
                className="p-6 rounded-[28px] bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#012169]">
                    {doc.type}
                  </span>
                  {doc.requiresSignature && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
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
    </div>
  );
}
