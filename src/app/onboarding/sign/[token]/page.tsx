import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import SignaturePad from "@/components/onboarding/SignaturePad";
import { FileSignature, CheckCircle2, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DirectSigningPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const sigReq = await prisma.signatureRequest.findUnique({
    where: { token },
    include: {
      onboarding: { include: { client: true } },
      document: {
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      },
      signatories: true,
    },
  });

  if (!sigReq) notFound();

  const isSigned = sigReq.status === "SIGNED";
  const latestVersion = sigReq.document.versions[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0c0e] text-slate-900 dark:text-zinc-100 flex flex-col font-sans">
      <header className="h-16 border-b border-slate-200 dark:border-white/5 bg-white/90 dark:bg-zinc-950/90 backdrop-blur px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-[#012169] dark:text-blue-400" />
          <span className="text-xs font-black uppercase tracking-wider">
            BritSync Secure E-Sign
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200">
          <Lock className="w-3 h-3 inline mr-1" /> Verified Legal Session
        </span>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-10 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
            {sigReq.title}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Prepared for {sigReq.onboarding.client.company || sigReq.onboarding.client.name} &bull; Signatory: {sigReq.signatories[0]?.name}
          </p>
        </div>

        {/* Document Content Box */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-sm max-h-96 overflow-y-auto font-mono text-xs whitespace-pre-line text-slate-700 dark:text-zinc-300 leading-relaxed">
          {latestVersion?.content || "Document content not available."}
        </div>

        {isSigned ? (
          <div className="p-8 rounded-[28px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h2 className="text-lg font-black uppercase text-emerald-800 dark:text-emerald-300">
              Document Signed & Executed
            </h2>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              This document has been executed and recorded in the audit trail.
            </p>
          </div>
        ) : (
          <SignaturePad
            signerName={sigReq.signatories[0]?.name || sigReq.onboarding.client.name}
            documentTitle={sigReq.title}
            documentId={sigReq.documentId}
            token={sigReq.onboarding.secureToken}
            onSigned={() => {
              // Refreshes upon completion
              window.location.reload();
            }}
          />
        )}
      </main>
    </div>
  );
}
