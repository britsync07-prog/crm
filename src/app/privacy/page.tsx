import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0f0f10] py-24 px-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 p-12 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-10">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-[1.5rem] bg-[#012169] flex items-center justify-center shrink-0">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">Privacy Policy</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Last updated: January 2026</p>
          </div>
        </div>

        <div className="prose prose-sm text-zinc-600 dark:text-zinc-400 space-y-6">
          <p>
            Your privacy matters to us. This policy explains how we collect, use, and protect your information.
          </p>
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter italic">1. Information We Collect</h3>
          <p>
            We collect information you provide when creating an account: name, email, and billing information. We also collect usage data to improve our service.
          </p>
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter italic">2. How We Use It</h3>
          <p>
            Your data is used to provide and improve the service, process transactions, send notifications, and provide support.
          </p>
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter italic">3. Data Protection</h3>
          <p>
            We implement industry-standard security measures including encryption, access controls, and regular audits.
          </p>
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter italic">4. Contact</h3>
          <p>
            For privacy inquiries, email <a href="mailto:support@britsyncai.com" className="text-[#012169] underline">support@britsyncai.com</a>.
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
