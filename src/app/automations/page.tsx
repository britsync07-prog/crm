import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  Zap, 
  Play, 
  Settings2, 
  Trash2, 
  Plus, 
  Clock, 
  Activity, 
  AlertCircle,
  CheckCircle2,
  Cpu,
  Workflow,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default async function AutomationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const userId = session.id;

  const automations = await prisma.automation.findMany({
    where: { userId },
    include: { steps: true, logs: { take: 5, orderBy: { createdAt: "desc" } } }
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-500" /> Neural <span className="text-amber-500 not-italic">Engine</span>
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Autonomous business workflows and cognitive event triggers.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/automations/new"
            className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
          >
            <Plus className="w-4 h-4" /> New Workflow
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Active Workflows */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase italic tracking-tight">Active Workflows</h2>
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{automations.length} total active</span>
          </div>

          <div className="grid gap-4">
            {automations.map((auto) => (
              <div key={auto.id} className="bg-white dark:bg-zinc-950 p-6 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm group hover:border-blue-700/30 transition-all">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-[#012169]/10 flex items-center justify-center shrink-0">
                    <Workflow className="w-6 h-6 text-[#012169]" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase italic">{auto.name}</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-zinc-500">{auto.description || "No description provided."}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 pt-4">
                      <div className="px-3 py-1 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                        {auto.triggerType}
                      </div>
                      <ArrowRight className="w-3 h-3 text-zinc-300" />
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-[#012169]/10 border border-blue-100 dark:border-blue-900/30 text-[9px] font-black uppercase tracking-widest text-[#012169]">
                        {auto.steps.length} Steps
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 justify-center border-l border-zinc-100 dark:border-white/5 pl-6">
                    <button className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-red-50 hover:text-red-500 transition-all text-zinc-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {automations.length === 0 && (
              <div className="p-20 text-center border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-[40px] opacity-30 italic font-medium text-zinc-500">
                The neural network is quiet. Deploy your first bot.
              </div>
            )}
          </div>
        </div>

        {/* Real-time Logs */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase italic tracking-tight">Execution Pulse</h2>
            <Activity className="w-5 h-5 text-[#012169] animate-pulse" />
          </div>

          <div className="space-y-4">
            {automations.flatMap(a => a.logs).map((log) => (
              <div key={log.id} className="bg-white dark:bg-zinc-950 p-5 rounded-[24px] border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {log.status === "SUCCESS" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-widest ${log.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                      {log.status}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                  Executed in <span className="font-black text-[#012169]">{log.executionTime}ms</span>. Neural path cleared.
                </p>
              </div>
            ))}
            {automations.every(a => a.logs.length === 0) && (
              <div className="p-12 text-center border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-[32px] opacity-20">
                <Cpu className="w-8 h-8 mx-auto mb-4 text-zinc-400" />
                <p className="text-[10px] font-black uppercase tracking-widest">No activity signals</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
