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
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function Dashboard() { 
  const session = await getSession();
  const userId = session.id;

  // Use the new AnalyticsService for backend calculations
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
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20 h-full overflow-y-auto pr-4 scrollbar-hide">
      {/* Header Intelligence */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900 rounded-[40px] p-10 border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-600/20 transition-all duration-1000"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase italic">
              Executive <span className="text-indigo-500 not-italic">Overview</span>
            </h1>
          </div>
          <p className="text-zinc-400 font-medium max-w-xl text-lg leading-relaxed">
            Welcome back, <span className="text-white font-bold">{session.name}</span>. Your growth engine is operating at <span className="text-green-500 font-black">94% efficiency</span> today.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <Link href="/finder" className="bg-white text-black px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-black/50">
              Execute Strategy
            </Link>
            <Link href="/billing" className="text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 group">
              Financial Audit <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-8 relative z-10">
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Global Pulse</p>
            <p className="text-xs italic font-bold text-green-500 flex items-center justify-end gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span> Network Status: Elite
            </p>
          </div>
        </div>
      </div>

      {/* Enterprise Pulse Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: "Monthly Revenue (MRR)", 
            value: `$${financialStats.mrr.toLocaleString()}`, 
            icon: CreditCard, 
            color: "text-green-500", 
            trend: `+${financialStats.activeSubscriptionsCount} active` 
          },
          { 
            label: "Pipeline Value", 
            value: `$${pipelineStats.totalValue.toLocaleString()}`, 
            icon: DollarSign, 
            color: "text-indigo-500", 
            trend: `${pipelineStats.totalDeals} deals` 
          },
          { 
            label: "Conversion Rate", 
            value: `${conversionStats.conversionRate.toFixed(1)}%`, 
            icon: Target, 
            color: "text-blue-500", 
            trend: `${conversionStats.totalLeads} leads` 
          },
          { 
            label: "Control Queue", 
            value: activityStats.completedTasks30d.toString(), 
            icon: Zap, 
            color: "text-amber-500", 
            trend: "last 30d" 
          }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-950 p-8 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm group hover:border-indigo-500/30 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-zinc-100 text-zinc-700 uppercase tracking-tighter">
                {stat.trend}
              </span>
            </div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">{stat.label}</p>
            <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Growth Matrix */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Intent Discovery
            </h3>
            <Link href="/leads" className="text-[10px] font-black uppercase text-indigo-500 tracking-widest hover:underline">Full Pipeline →</Link>
          </div>
          
          <div className="overflow-hidden rounded-[40px] border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-sm">
            <div className="p-8 space-y-6">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex items-center justify-center font-black text-zinc-400">
                      {lead.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-500 transition-colors">{lead.name}</h4>
                      <p className="text-xs text-zinc-500 font-medium">{lead.company || lead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-zinc-400">Score</p>
                      <p className={`text-xs font-black ${lead.aiScore > 70 ? 'text-green-500' : 'text-amber-500'}`}>{lead.aiScore}/100</p>
                    </div>
                    <Link href={`/leads/${lead.id}`} className="p-2 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-indigo-600 hover:text-white transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
              {recentLeads.length === 0 && (
                <div className="py-12 text-center opacity-30 italic font-medium text-zinc-500">No recent leads found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Tactical Feed */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Control Queue
            </h3>
          </div>

          <div className="space-y-4">
            {upcomingTasks.map((task: any) => (
              <div key={task.id} className="p-6 bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm relative group hover:border-indigo-500/30 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/5 text-zinc-500`}>
                      {task.priority}
                    </span>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 leading-snug">{task.title}</h4>
                    {task.customer && (
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{task.customer.name}</p>
                    )}
                  </div>
                  <button className="w-8 h-8 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center hover:bg-green-500 hover:border-green-500 hover:text-white transition-all">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {upcomingTasks.length === 0 && (
              <div className="py-12 text-center opacity-20 italic font-medium text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-[32px]">No urgent tasks.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
