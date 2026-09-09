import { getClientOnboardingData } from "@/app/onboarding/portal-actions";
import ClientPortalWizard from "@/components/onboarding/ClientPortalWizard";
import Link from "next/link";
import { AlertTriangle, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const res = await getClientOnboardingData(token);

  if (!res.success || !res.data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0c0c0e] flex items-center justify-center p-6 text-slate-900 dark:text-zinc-100">
        <div className="max-w-md w-full p-8 rounded-[32px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 mx-auto flex items-center justify-center shadow">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight">
            Invalid or Expired Link
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {res.error || "This onboarding access link is invalid, completed, or has expired."}
          </p>
          <div className="pt-2">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Please contact your BritSync account manager to request a new secure onboarding link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <ClientPortalWizard data={res.data} token={token} />;
}
