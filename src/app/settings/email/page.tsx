import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmailAccountForm } from "@/components/EmailAccountForm";
import { Mail, Zap, CheckCircle2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function EmailSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/landing");

  const accounts = await prisma.emailAccount.findMany({
    where: { userId: session.id }
  });

  return (
    <div className="space-y-12 sm:space-y-16 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-[2rem] bg-[#012169] flex items-center justify-center shadow-2xl shadow-blue-900/20">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter uppercase text-zinc-900 dark:text-zinc-50 leading-none">Mailboxes</h1>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-1">Global Communication Hub</p>
          </div>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-12 xl:col-span-4">
          <EmailAccountForm />
        </div>

        <div className="lg:col-span-12 xl:col-span-8 space-y-10">
          <div className="rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 sm:p-12 shadow-2xl relative overflow-hidden shelf-shadow">
            <h2 className="text-sm font-black uppercase italic tracking-[0.3em] mb-10 flex items-center gap-4 text-zinc-900 dark:text-zinc-50">
              <Zap className="w-5 h-5 text-[#012169] fill-blue-600" /> Connected Gateways
            </h2>
            
            <div className="space-y-6">
              {accounts.map((acc) => (
                <div key={acc.id} className="p-6 sm:p-8 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group transition-all hover:bg-white dark:hover:bg-zinc-900 hover:border-blue-700/30">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-[#012169]/10 text-[#012169] flex items-center justify-center font-black text-xl italic shadow-inner">
                      {acc.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm sm:text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-50 break-all">{acc.email}</p>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">SMTP: {acc.host.toUpperCase()}:{acc.port}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-10 w-full sm:w-auto border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800 pt-6 sm:pt-0">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">TRAFFIC LIMIT</p>
                      <p className="text-sm font-black tabular-nums text-zinc-900 dark:text-zinc-50">{acc.sentToday} / {acc.dailyLimit}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{acc.isActive ? 'Active' : 'Offline'}</span>
                      <div className={`h-2.5 w-2.5 rounded-full animate-pulse shadow-lg ${acc.isActive ? 'bg-green-500 shadow-green-500/40' : 'bg-red-500 shadow-red-500/40'}`} />
                    </div>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <div className="text-center py-20 opacity-30 select-none pointer-events-none">
                  <Mail className="w-16 h-16 mx-auto mb-6 text-zinc-300" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Waiting for Authentication</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-violet-700 p-10 sm:p-14 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-1000">
              <Zap className="w-40 h-40" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-4">
              <CheckCircle2 className="w-7 h-7" /> Deliverability Protocol
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
              <ul className="text-[10px] sm:text-xs font-black uppercase tracking-widest space-y-4 text-blue-100">
                <li className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all cursor-default"><span className="text-green-400 shrink-0">✔</span> SPF Record Secured</li>
                <li className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all cursor-default"><span className="text-green-400 shrink-0">✔</span> DKIM Signature Verified</li>
              </ul>
              <ul className="text-[10px] sm:text-xs font-black uppercase tracking-widest space-y-4 text-blue-100">
                <li className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all cursor-default"><span className="text-red-400 shrink-0">✘</span> DMARC Policy Missing</li>
                <li className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all cursor-default"><span className="text-blue-300 shrink-0">●</span> Warm-up Phase: Day 2/14</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
