import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  Send,
  Target,
  BarChart3,
  MousePointer2,
  Mail,
  MessageSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Zap,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default async function CampaignsPage() {
  const session = await getSession();
  const userId = session.id;

  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    include: { leads: true }
  });

  const activeCampaigns = campaigns.filter(c => c.status === "Active");
  const totalSent = campaigns.reduce((acc, c) => acc + c.leads.filter(l => l.sentAt).length, 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + c.leads.filter(l => l.openedAt).length, 0);
  const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic flex items-center gap-3">
            <Target className="w-8 h-8 text-indigo-500" /> Outreach <span className="text-indigo-500 not-italic">Lab</span>
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Multi-channel campaign orchestration and cognitive response tracking.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/campaigns/new"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> New Campaign
          </Link>
        </div>
      </div>

      {/* Conversion Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Pulse", value: activeCampaigns.length.toString(), icon: Zap, color: "text-amber-500", sub: "Live Campaigns" },
          { label: "Total Outreach", value: totalSent.toLocaleString(), icon: Send, color: "text-indigo-500", sub: "Messages Sent" },
          { label: "Cognitive Open", value: `${openRate.toFixed(1)}%`, icon: MousePointer2, color: "text-green-500", sub: "Engagement Rate" },
          { label: "Conversion Delta", value: "+14.2%", icon: TrendingUp, color: "text-blue-500", sub: "vs Last Period" }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-950 p-8 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
            <div className={`p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 w-fit ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">{stat.label}</p>
              <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{stat.value}</p>
              <p className="text-[10px] font-bold text-zinc-500 mt-2 italic">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Campaign Queue */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" /> Active Queue
          </h2>

          <div className="grid gap-4">
            {campaigns.map((camp) => (
              <div key={camp.id} className="bg-white dark:bg-zinc-950 p-8 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-sm group hover:border-indigo-500/30 transition-all relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${camp.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-zinc-100 text-zinc-700 dark:bg-white/5 dark:text-zinc-400'
                        }`}>
                        {camp.status}
                      </span>
                      <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">{camp.type}</span>
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic">{camp.name}</h3>
                    <p className="text-sm font-medium text-zinc-500 line-clamp-1 italic">Subject: "{camp.subject}"</p>
                  </div>

                  <div className="grid grid-cols-3 gap-8 border-l border-zinc-100 dark:border-white/5 pl-8">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">Reach</p>
                      <p className="text-lg font-black">{camp.leads.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">Open</p>
                      <p className="text-lg font-black text-indigo-500">{camp.leads.filter(l => l.openedAt).length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">Reply</p>
                      <p className="text-lg font-black text-green-500">{camp.leads.filter(l => l.repliedAt).length}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {camp.leads.slice(0, 3).map((l, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[8px] font-black">
                          {l.id[0].toUpperCase()}
                        </div>
                      ))}
                      {camp.leads.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[8px] font-black text-zinc-400">
                          +{camp.leads.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Leads Sequenced</span>
                  </div>
                  <Link href={`/campaigns/${camp.id}`} className="text-[10px] font-black uppercase text-indigo-500 hover:underline">Analytics Matrix →</Link>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && (
              <div className="p-20 text-center border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-[40px] opacity-30 italic font-medium text-zinc-500">
                No active outreach detected. Launch a strike.
              </div>
            )}
          </div>
        </div>

        {/* Intelligence Side Column */}
        <div className="space-y-8">
          <div className="bg-indigo-600 p-8 rounded-[40px] text-white space-y-6 shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles className="w-20 h-20" />
            </div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-xl font-black uppercase italic tracking-tight">AI Copy Architect</h3>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed italic">
                "Our neural engine suggests adding a 'Case Study' link to your sequences. Historically, this increases reply rates by <span className="font-black">22%</span> for your industry."
              </p>
              <button className="w-full py-4 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all">
                Optimize Templates
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-8 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-sm space-y-6">
            <h3 className="text-lg font-black uppercase italic tracking-tight">Channel Pulse</h3>
            <div className="space-y-4">
              {[
                { label: "Direct Email", value: "84%", icon: Mail, color: "text-blue-500" },
                { label: "SMS Broadcast", value: "92%", icon: MessageSquare, color: "text-green-500" },
                { label: "LinkedIn Automation", value: "68%", icon: Target, color: "text-indigo-500" }
              ].map(channel => (
                <div key={channel.label} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <channel.icon className={`w-4 h-4 ${channel.color}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{channel.label}</span>
                  </div>
                  <span className="text-sm font-black italic">{channel.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
