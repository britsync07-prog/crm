import { CreditCard } from "lucide-react";
import NavTabs from "@/components/billing/NavTabs";

export const dynamic = "force-dynamic";

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-6 pt-20 lg:pt-8">
      <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-white/5 pb-6">
        <div className="p-3 rounded-2xl bg-[#012169]/10 dark:bg-[#012169]/20">
          <CreditCard className="w-6 h-6 text-[#012169] dark:text-blue-300" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic">
            Capital <span className="text-green-500 not-italic">&</span> Ledger
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Enterprise financial oversight powered by BritLedger AI.</p>
        </div>
      </div>

      <NavTabs />

      {children}
    </div>
  );
}
