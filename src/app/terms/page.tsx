import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0f0f10] py-24 px-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 p-12 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-10">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-[1.5rem] bg-[#012169] flex items-center justify-center shrink-0">
            <Scale className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">Terms of Service</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Last updated: January 2026</p>
          </div>
        </div>

        <div className="prose prose-sm text-zinc-600 dark:text-zinc-400 space-y-6">
          <p>
            By using BritCRM, you agree to these terms. If you do not agree, do not use the service.
          </p>
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter italic">1. Service Usage</h3>
          <p>
            You are responsible for maintaining the confidentiality of your account and for all activities that occur under it.
          </p>
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter italic">2. Data & Privacy</h3>
          <p>
            We take data security seriously. Your data is encrypted in transit and at rest. We do not sell your data to third parties.
          </p>
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter italic">3. Limitations</h3>
          <p>
            The service is provided &quot;as is&quot; without warranty of any kind. We reserve the right to update these terms at any time.
          </p>
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter italic">4. Contact</h3>
          <p>
            For questions about these terms, email <a href="mailto:support@britsyncai.com" className="text-[#012169] underline">support@britsyncai.com</a>.
          </p>
        </div>

        <div>
          <Link href="/signup" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#012169] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
