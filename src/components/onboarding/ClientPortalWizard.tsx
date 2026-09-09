"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileSignature,
  FileText,
  UploadCloud,
  CreditCard,
  Sparkles,
  Check,
  Edit2,
  Lock,
} from "lucide-react";
import SignaturePad from "./SignaturePad";
import {
  submitClientResponseAction,
  completeClientPortalAction,
} from "@/app/onboarding/portal-actions";

interface ClientPortalWizardProps {
  data: any;
  token: string;
}

export default function ClientPortalWizard({ data, token }: ClientPortalWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [verifiedCompany, setVerifiedCompany] = useState(data.client.company || "");
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  // Responses state
  const [responses, setResponses] = useState<Record<string, any>>(() => {
    const map: Record<string, any> = {};
    for (const r of data.responses || []) {
      map[r.key] = r.value;
    }
    return map;
  });

  const [activeSignDoc, setActiveSignDoc] = useState<any | null>(null);
  const [completedSignatures, setCompletedSignatures] = useState<string[]>(() => {
    return (data.signatureRequests || [])
      .filter((s: any) => s.status === "SIGNED")
      .map((s: any) => s.documentId);
  });

  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isComplete, setIsComplete] = useState(data.status === "READY_FOR_ACTIVATION" || data.status === "COMPLETED");

  const totalSteps = 5;

  const handleResponseChange = async (key: string, label: string, val: any, type: string = "text") => {
    const updated = { ...responses, [key]: val };
    setResponses(updated);
    await submitClientResponseAction(token, key, label, val, type);
  };

  const handleDocumentSigned = (certificate: any) => {
    if (activeSignDoc) {
      setCompletedSignatures((prev) => [...prev, activeSignDoc.id]);
      setActiveSignDoc(null);
    }
  };

  const handleComplete = async () => {
    setIsFinishing(true);
    try {
      await completeClientPortalAction(token);
      setIsComplete(true);
    } finally {
      setIsFinishing(false);
    }
  };

  // Signable documents
  const unsignedDocs = data.documents.filter((d: any) => {
    const sigReq = data.signatureRequests.find((s: any) => s.documentId === d.id);
    return sigReq && !completedSignatures.includes(d.id);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0c0e] text-slate-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Top Client Brand Header */}
      <header className="h-20 border-b border-slate-200 dark:border-white/5 bg-white/90 dark:bg-zinc-950/90 backdrop-blur sticky top-0 z-20 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#012169] to-[#c8102e] flex items-center justify-center text-white font-black text-sm shadow-md">
            BS
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight uppercase italic leading-none">
              BritSync <span className="text-[#012169] dark:text-blue-400">Onboarding</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {data.serviceName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/30">
            <Lock className="w-3 h-3" /> 256-Bit Encrypted Portal
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-10 flex flex-col justify-center animate-in fade-in duration-300">
        {!isComplete ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[36px] p-6 sm:p-10 shadow-xl space-y-8">
            {/* Step Progress Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Step {step} of {totalSteps}</span>
                <span>
                  {step === 1 && "Confirm Information"}
                  {step === 2 && "Project Preferences"}
                  {step === 3 && "Review & E-Sign"}
                  {step === 4 && "Upload Assets"}
                  {step === 5 && "Review & Complete"}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#012169] dark:bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* STEP 1: CONFIRM EXISTING CRM INFORMATION (Information Reuse) */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#012169] dark:text-blue-400">
                    Step 1 &bull; Verification
                  </span>
                  <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white mt-1">
                    Welcome, {data.client.name}!
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    We&apos;re excited to begin your project. We already have your core information on file. Please confirm it below so we never ask you twice.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Company Name</p>
                      {isEditingCompany ? (
                        <input
                          type="text"
                          value={verifiedCompany}
                          onChange={(e) => setVerifiedCompany(e.target.value)}
                          className="mt-1 px-3 py-1.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-zinc-900"
                        />
                      ) : (
                        <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{verifiedCompany}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingCompany(!isEditingCompany)}
                      className="text-xs font-bold text-[#012169] dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> {isEditingCompany ? "Done" : "Change"}
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-white/5 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Primary Contact</p>
                      <p className="font-bold text-slate-800 dark:text-zinc-200 mt-0.5">{data.client.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Email Address</p>
                      <p className="font-bold text-slate-800 dark:text-zinc-200 mt-0.5">{data.client.email}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[#012169] dark:text-blue-400 shrink-0" />
                  <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium">
                    This onboarding wizard takes approximately <strong>3 minutes</strong>. Your progress is saved automatically.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: SERVICE-SPECIFIC PROGRESSIVE QUESTIONS */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#012169] dark:text-blue-400">
                    Step 2 &bull; Progressive Questions
                  </span>
                  <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white mt-1">
                    Project & Technical Preferences
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Please answer only the essential technical and operational details needed to configure your delivery.
                  </p>
                </div>

                <div className="space-y-4">
                  {data.questions.map((q: any) => {
                    if (q.type === "file") return null; // Handled in step 4

                    return (
                      <div key={q.key} className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-200">
                          {q.label} {q.required && <span className="text-red-500">*</span>}
                        </label>
                        {q.subtitle && (
                          <p className="text-xs text-slate-400">{q.subtitle}</p>
                        )}

                        {q.type === "choice" ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {(q.options || []).map((opt: string) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleResponseChange(q.key, q.label, opt, "choice")}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  responses[q.key] === opt
                                    ? "bg-[#012169] text-white border-[#012169]"
                                    : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-white/10 hover:border-slate-300"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={responses[q.key] || ""}
                            onChange={(e) => handleResponseChange(q.key, q.label, e.target.value, "text")}
                            placeholder="Type your answer here..."
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: DOCUMENT REVIEW & DIGITAL SIGNING */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#012169] dark:text-blue-400">
                    Step 3 &bull; Digital Signature
                  </span>
                  <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white mt-1">
                    Agreements & Legal Signatures
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Review your agreements and sign digitally using our DocuSign-style mobile execution pad.
                  </p>
                </div>

                {activeSignDoc ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 max-h-56 overflow-y-auto font-mono text-xs whitespace-pre-line text-slate-700 dark:text-zinc-300">
                      {activeSignDoc.content}
                    </div>

                    <SignaturePad
                      signerName={data.client.name}
                      documentTitle={activeSignDoc.title}
                      documentId={activeSignDoc.id}
                      token={token}
                      onSigned={handleDocumentSigned}
                      onCancel={() => setActiveSignDoc(null)}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.documents.map((doc: any) => {
                      const sigReq = data.signatureRequests.find((s: any) => s.documentId === doc.id);
                      const isSigned = completedSignatures.includes(doc.id) || sigReq?.status === "SIGNED";

                      return (
                        <div
                          key={doc.id}
                          className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                              {sigReq ? <FileSignature className="w-5 h-5 text-indigo-500" /> : <FileText className="w-5 h-5 text-blue-500" />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 dark:text-white">{doc.title}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">
                                {sigReq ? (isSigned ? "Signed & Verified" : "Digital Signature Required") : "Informational Notice"}
                              </p>
                            </div>
                          </div>

                          <div>
                            {sigReq ? (
                              isSigned ? (
                                <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl">
                                  <Check className="w-3.5 h-3.5" /> Signed
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setActiveSignDoc(doc)}
                                  className="px-4 py-2 rounded-xl bg-[#012169] text-white text-xs font-black uppercase tracking-wider hover:bg-[#c8102e] transition-all cursor-pointer shadow-sm"
                                >
                                  Sign Now
                                </button>
                              )
                            ) : (
                              <span className="text-xs text-slate-400 font-bold">Reviewed</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {unsignedDocs.length === 0 && (
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                          All mandatory agreements have been signed! Proceed to the next step.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: FILE UPLOADS & ASSETS */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#012169] dark:text-blue-400">
                    Step 4 &bull; Assets
                  </span>
                  <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white mt-1">
                    Upload Relevant Project Assets
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Optional: Upload any brand guidelines, API documentation, or architecture diagrams to accelerate implementation.
                  </p>
                </div>

                <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 text-center space-y-3 bg-slate-50 dark:bg-zinc-950">
                  <UploadCloud className="w-10 h-10 mx-auto text-slate-400" />
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-[#012169] dark:text-blue-400 cursor-pointer hover:underline">
                      Click to upload files
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadedFiles([...uploadedFiles, file.name]);
                            handleResponseChange("uploadedAssets", "Uploaded Assets", file.name, "file");
                          }
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">PDF, PNG, JPG, or ZIP up to 25MB</p>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Uploaded Files:</p>
                    {uploadedFiles.map((file) => (
                      <div key={file} className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-between text-xs font-bold">
                        <span>{file}</span>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: REVIEW & COMPLETE */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#012169] dark:text-blue-400">
                    Step 5 &bull; Summary
                  </span>
                  <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white mt-1">
                    Review & Complete Onboarding
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Everything required to begin delivery has been configured.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 space-y-4 text-xs">
                  <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                    <span className="text-slate-400 font-bold">Service:</span>
                    <span className="font-black text-slate-900 dark:text-white">{data.serviceName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                    <span className="text-slate-400 font-bold">Estimated Kickoff:</span>
                    <span className="font-black text-slate-900 dark:text-white">{data.commercial.startDate || "Next Week"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                    <span className="text-slate-400 font-bold">Agreements Signed:</span>
                    <span className="font-black text-emerald-600">
                      {completedSignatures.length} executed
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Dedicated Lead:</span>
                    <span className="font-black text-slate-900 dark:text-white">{data.commercial.accountManager || "Account Lead"}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  Click <strong>&quot;Submit & Complete Onboarding&quot;</strong> to notify your account team and prepare your kickoff session.
                </div>
              </div>
            )}

            {/* Wizard Navigation Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
              ) : <div />}

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="bg-[#012169] hover:bg-[#c8102e] text-white px-7 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={isFinishing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg hover:shadow-xl cursor-pointer"
                >
                  {isFinishing ? "Finalizing..." : "Submit & Complete Onboarding"}
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* COMPLETION CELEBRATION SCREEN */
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[36px] p-8 sm:p-12 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">
                Onboarding Completed
              </span>
              <h2 className="text-3xl font-black uppercase text-slate-900 dark:text-white">
                You&apos;re All Set, {data.client.name}!
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Thank you for completing your onboarding. All agreements are secured, and our team has been notified to finalize your kickoff session.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 max-w-md mx-auto text-left text-xs space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Next Milestones:</p>
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-200">
                <Check className="w-4 h-4 text-emerald-500" /> Account Lead Assigned: {data.commercial.accountManager || "Lead Architect"}
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-200">
                <Check className="w-4 h-4 text-emerald-500" /> Kickoff Window: {data.commercial.startDate || "Scheduled"}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[10px] font-bold text-slate-400 border-t border-slate-200 dark:border-white/5">
        BritSync AI Enterprise Client Onboarding &bull; Secure Audit Verification Trail
      </footer>
    </div>
  );
}
