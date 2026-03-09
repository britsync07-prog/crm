import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  Share2,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Calendar,
  Clock,
  Plus,
  BarChart3,
  MessageSquare,
  ThumbsUp,
  ExternalLink,
  Bot
} from "lucide-react";
import Link from "next/link";

export default async function SocialMediaPage() {
  const session = await getSession();
  const userId = session.id;

  const accounts = await prisma.socialAccount.findMany({
    where: { userId },
    include: { posts: { take: 5, orderBy: { createdAt: "desc" } } }
  });

  const scheduledPosts = await prisma.socialPost.findMany({
    where: {
      socialAccount: { userId },
      status: "SCHEDULED"
    },
    include: { socialAccount: true },
    orderBy: { scheduledFor: "asc" }
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic flex items-center gap-3">
            <Share2 className="w-8 h-8 text-indigo-500" /> Omni <span className="text-indigo-500 not-italic">Social</span>
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Cross-platform content orchestration and engagement analytics.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/social/new"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> Create Post
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Command Hub */}
        <div className="lg:col-span-2 space-y-10">
          {/* AI Content Strategy */}
          <div className="bg-zinc-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/20 blur-[100px] rounded-full translate-x-1/4 -translate-y-1/4"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-2xl">
                <Bot className="w-10 h-10" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-2xl font-black uppercase italic">AI Social Strategist</h3>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                  "Based on current engagement DNA, the best time to post on <span className="text-white font-bold">LinkedIn</span> is <span className="text-indigo-400 font-black">9:15 AM tomorrow</span>. Your audience is showing high interest in 'Scalable SaaS' topics."
                </p>
              </div>
              <button className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all whitespace-nowrap">
                Generate Drafts
              </button>
            </div>
          </div>

          {/* Scheduled Queue */}
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Content Queue
            </h2>

            <div className="space-y-4">
              {scheduledPosts.map((post) => (
                <div key={post.id} className="bg-white dark:bg-zinc-950 p-6 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-6 group hover:border-indigo-500/30 transition-all">
                  <div className="w-full md:w-48 h-32 rounded-2xl bg-zinc-100 dark:bg-white/5 overflow-hidden relative">
                    <div className="absolute top-2 left-2 p-1.5 rounded-lg bg-white/90 dark:bg-black/50 backdrop-blur-sm">
                      {post.socialAccount.platform === 'FACEBOOK' && <Facebook className="w-3 h-3 text-blue-600" />}
                      {post.socialAccount.platform === 'LINKEDIN' && <Linkedin className="w-3 h-3 text-blue-700" />}
                      {post.socialAccount.platform === 'TWITTER' && <Twitter className="w-3 h-3 text-sky-500" />}
                    </div>
                    {/* Placeholder for media */}
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                      <Share2 className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Scheduled for {new Date(post.scheduledFor!).toLocaleString()}</span>
                        <div className="flex gap-2">
                          <button className="p-2 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-red-50 hover:text-red-500 text-zinc-400 transition-all"><ThumbsUp className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 line-clamp-2 italic">"{post.content}"</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black uppercase">{post.socialAccount.platform[0]}</div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{post.socialAccount.platform}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {scheduledPosts.length === 0 && (
                <div className="p-20 text-center border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-[40px] opacity-30 italic font-medium text-zinc-500">
                  No content scheduled. The silence is deafening.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Analytics & Accounts */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-zinc-950 p-8 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black uppercase italic tracking-tight">Connected</h3>
              <Link href="/social/connect" className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">+ Connect</Link>
            </div>

            <div className="space-y-4">
              {['Facebook', 'LinkedIn', 'Instagram', 'Twitter', 'TikTok'].map((platform) => {
                const connected = accounts.find(a => a.platform.toUpperCase() === platform.toUpperCase());
                return (
                  <div key={platform} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 group hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected ? 'bg-indigo-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
                        {platform === 'Facebook' && <Facebook className="w-5 h-5" />}
                        {platform === 'LinkedIn' && <Linkedin className="w-5 h-5" />}
                        {platform === 'Instagram' && <Instagram className="w-5 h-5" />}
                        {platform === 'Twitter' && <Twitter className="w-5 h-5" />}
                        {platform === 'TikTok' && <Youtube className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase">{platform}</p>
                        <p className="text-[9px] font-black uppercase text-zinc-400">{connected ? 'Authorized' : 'Disconnected'}</p>
                      </div>
                    </div>
                    {connected && (
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[40px] text-white space-y-6 shadow-2xl shadow-indigo-500/20">
            <h3 className="text-lg font-black uppercase italic tracking-tight">Monthly Reach</h3>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black italic">42.8k</span>
                <span className="text-indigo-200 text-xs font-bold uppercase mb-1.5">+18%</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white w-2/3 shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
              </div>
              <p className="text-[10px] font-bold uppercase text-indigo-100 italic">Targeting 60k by EOM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
