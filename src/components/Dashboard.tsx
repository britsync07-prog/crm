import { AnalyticsService } from "@/lib/services/analytics.service";
import { getSession } from "@/lib/auth";
import { 
  Users, 
  UserPlus, 
  Mail, 
  CheckCircle2, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  ArrowUpRight, 
  Search, 
  DollarSign, 
  Layers,
  Sparkles,
  PlayCircle,
  MessageCircle,
  Clock,
  Target,
  CreditCard,
  Network,
  Rocket
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

export default async function Dashboard() { 
  const session = await getSession();
  const userId = session.id;

  const [
    pipelineStats,
    conversionStats,
    financialStats,
    activityStats,
    recentLeads,
    upcomingTasks
  ] = await Promise.all([
    AnalyticsService.getPipelineStats(userId),
    AnalyticsService.getLeadConversionStats(userId),
    AnalyticsService.getFinancialStats(userId),
    AnalyticsService.getActivityStats(userId),
    prisma.lead.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    (prisma as any).task.findMany({ 
      where: { assigneeId: userId, status: { notIn: ["Done", "Completed"] } }, 
      orderBy: { dueDate: "asc" }, 
      take: 5, 
      include: { customer: true } 
    })
  ]);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-10 py-8 sm:py-12 space-y-12 sm:space-y-16 animate-in fade-in duration-1000 pb-32">
      {/* Dynamic Intelligence Header */}
      <div className="relative rounded-[3rem] sm:rounded-[4.5rem] bg-gradient-to-br from-[#012169] via-[#0b2a74] to-[#c8102e] border-[6px] border-white/60 dark:border-blue-900/30 p-8 sm:p-16 overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/20 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-white/30 transition-all duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-500/15 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2 group-hover:bg-red-500/25 transition-all duration-1000"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12 sm:gap-16">
          <div className="space-y-8 sm:space-y-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[2rem] bg-white/15 border border-white/30 flex items-center justify-center text-white shadow-2xl shrink-0">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                 <h1 className="text-4xl sm:text-7xl font-black tracking-tighter text-white uppercase italic leading-none">
 BritCRM <span className="text-blue-100 not-italic">Command</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-100/80 ml-1">Powered by BritSync</p>
              </div>
            </div>
            
            <p className="text-zinc-400 font-bold max-w-2xl text-lg sm:text-2xl leading-snug italic">
              Synchronizing session for <span className="text-zinc-50 dark:text-white font-black">{session.name}</span>. Growth engine is stabilized at <span className="text-green-400 font-black">94% Capacity</span>.
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
              <Link href="/finder" className="bg-white text-[#012169] px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#c8102e] hover:text-white transition-all shadow-2xl shadow-black/30 active:scale-95 flex items-center gap-3">
                <Rocket className="w-4 h-4" /> Global Scan
              </Link>
              <Link href="/billing" className="text-blue-100/80 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 group px-4 py-4">
                Financial Audit <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
          </div>
          
          <div className="hidden xl:flex flex-col items-end gap-10 text-right">
             <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Network Telemetry</p>
                <div className="flex items-center justify-end gap-3 text-green-400 font-black italic text-sm">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-ping shadow-[0_0_10px_#22c55e]" /> 
                   Connection: ELITE
                </div>
             </div>
             <div className="flex gap-4">
                <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-1 shadow-inner group/node hover:bg-white/10 transition-all">
                   <Network className="w-6 h-6 text-zinc-500 group-hover/node:text-blue-300" />
                   <span className="text-[8px] font-black text-zinc-600">NODES</span>
                </div>
                <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-1 shadow-inner group/node hover:bg-white/10 transition-all">
                   <Zap className="w-6 h-6 text-zinc-500 group-hover/node:text-amber-400" />
                   <span className="text-[8px] font-black text-zinc-600">PULSE</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Grid Matrix Stats - Responsive 1 to 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
        {[
          { 
            label: "Monthly Revenue (MRR)", 
            value: `$${financialStats.mrr.toLocaleString()}`, 
            icon: CreditCard, 
            color: "text-green-500", 
            trend: `${financialStats.activeSubscriptionsCount} ACTIVE NODES` 
          },
          { 
            label: "Pipeline Valuation", 
            value: `$${pipelineStats.totalValue.toLocaleString()}`, 
            icon: DollarSign, 
            color: "text-[#012169]", 
            trend: `${pipelineStats.totalDeals} SECTOR DEALS` 
          },
          { 
            label: "Conversion Velocity", 
            value: `${conversionStats.conversionRate.toFixed(1)}%`, 
            icon: Target, 
            color: "text-blue-500", 
            trend: `${conversionStats.totalLeads} PROCESSED LEADS` 
          },
          { 
            label: "Operational Queue", 
            value: activityStats.completedTasks30d.toString(), 
            icon: Zap, 
            color: "text-amber-500", 
            trend: "LAST 30 CYCLES" 
          }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-950 p-10 rounded-[3rem] border border-zinc-200 dark:border-zinc-900 shadow-xl group hover:border-[#012169] transition-all duration-500 hover:shadow-[0_40px_100px_rgba(0,0,0,0.1)] hover:-translate-y-2 border-b-[6px] border-b-zinc-50 dark:border-b-zinc-900">
            <div className="flex justify-between items-start mb-10">
              <div className={cn("p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 transition-all group-hover:scale-110", stat.color)}>
                <stat.icon className="w-8 h-8" />
              </div>
              <span className="text-[8px] font-black px-3 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900 text-zinc-400 uppercase tracking-widest border border-zinc-100 dark:border-zinc-800">
                {stat.trend}
              </span>
            </div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em] mb-2">{stat.label}</p>
            <p className="text-4xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tighter italic">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10 sm:gap-16">
        {/* Intelligence Matrix (Recent Leads) */}
        <div className="lg:col-span-2 space-y-12">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-[#012169]" /> Intent Feed
              </h3>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">REAL-TIME ACQUISITION TELEMETRY</p>
            </div>
            <Link href="/leads" className="flex items-center gap-2 text-[10px] font-black uppercase text-[#012169] tracking-widest group hover:gap-4 transition-all">
              Expansion Mode <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="overflow-hidden rounded-[3.5rem] border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 shadow-2xl shelf-shadow border-b-[6px]">
            <div className="p-8 sm:p-14 space-y-10 sm:space-y-12">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center font-black text-2xl italic text-zinc-200 group-hover:bg-[#012169] group-hover:text-white transition-all shadow-inner group-hover:rotate-6">
                      {lead.name[0]}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase italic tracking-tighter group-hover:text-[#012169] transition-colors leading-none">{lead.name}</h4>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{lead.company || lead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-12 pt-6 sm:pt-0 border-t sm:border-t-0 border-zinc-50 dark:border-zinc-900">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-zinc-300 tracking-widest">VELOCITY</p>
                      <p className={cn("text-lg font-black italic tracking-tighter", lead.aiScore > 70 ? 'text-green-500' : 'text-amber-500')}>{lead.aiScore}%</p>
                    </div>
                    <Link href={`/leads/${lead.id}`} className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center hover:bg-[#012169] hover:text-white transition-all shadow-xl active:scale-90">
                      <ArrowUpRight className="w-6 h-6" />
                    </Link>
                  </div>
                </div>
              ))}
              {recentLeads.length === 0 && (
                <div className="py-20 text-center opacity-20 italic font-black uppercase tracking-[0.3em] text-zinc-400">Scanner Idle: No Signals Detected</div>
              )}
            </div>
          </div>
        </div>

        {/* Tactical Control Feed (Tasks) */}
        <div className="space-y-12">
          <div className="space-y-1 px-2">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-500" /> Vector Queue
            </h3>
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">OPERATIONAL DIRECTIVES</p>
          </div>

          <div className="space-y-6">
            {upcomingTasks.map((task: any) => (
              <div key={task.id} className="p-8 bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-900 shadow-xl relative group hover:border-blue-600 transition-all border-b-[6px] hover:shadow-2xl">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <span className={cn("text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm", task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-zinc-50 text-zinc-400 border-zinc-100')}>
                        {task.priority.toUpperCase()} PRIORITY
                       </span>
                    </div>
                    <h4 className="text-lg font-black text-zinc-900 dark:text-zinc-100 leading-tight uppercase italic tracking-tight">{task.title}</h4>
                    {task.customer && (
                      <div className="flex items-center gap-2">
                         <Target className="w-3.5 h-3.5 text-[#012169]" />
                         <span className="text-[10px] font-black text-[#012169] uppercase tracking-widest">{task.customer.name}</span>
                      </div>
                    )}
                  </div>
                  <button className="w-12 h-12 rounded-2xl border-2 border-zinc-100 dark:border-zinc-900 flex items-center justify-center hover:bg-green-500 hover:border-green-500 hover:text-white transition-all shadow-sm active:scale-90">
                    <CheckCircle2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ))}
            {upcomingTasks.length === 0 && (
              <div className="py-24 text-center opacity-20 border-[4px] border-dashed border-zinc-100 dark:border-zinc-900 rounded-[3rem] shelf-shadow">
                 <Zap className="w-10 h-10 mx-auto mb-4 text-zinc-300" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Queue Stabilized</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
