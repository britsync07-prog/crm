import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0f0f10] p-4">
      <div className="bg-white dark:bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 w-full max-w-md text-center shadow-2xl space-y-8">
        <div className="w-16 h-16 rounded-[1.5rem] bg-[#012169] flex items-center justify-center mx-auto shadow-xl">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">
            Talk to Us
          </h1>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
            Our team is ready to help. Send us an email and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
        <a
          href="mailto:sales@britsyncai.com"
          className="inline-flex items-center gap-3 bg-[#012169] text-white px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-[#c8102e] transition-all shadow-2xl active:scale-95"
        >
          <Mail className="w-5 h-5" />
          sales@britsyncai.com
        </a>
        <div>
          <Link href="/landing" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#012169] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
