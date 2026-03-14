import { prisma } from "@/lib/db";
import { startOnboardingSession } from "@/app/onboarding-actions";
import Link from "next/link";
import { MessageCircle, Sparkles, UserCheck, Timer } from "lucide-react";

export default async function OnboardingPage() {
  const sessions = await prisma.onboardingSession.findMany({
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const leads = await prisma.lead.findMany({
    where: { status: "New" },
    take: 5,
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic">Onboarding Hub</h1>
          <p className="text-zinc-500 dark:text-zinc-400">AI-driven client onboarding and engagement chat boxes.</p>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-4 rounded-3xl bg-zinc-900 text-white flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-green-500" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Avg. Time</p>
              <p className="text-sm font-bold">14.2 Hours</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: New Clients to Onboard */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-zinc-900/50">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#012169] mb-6 flex items-center gap-2">
              <Timer className="w-4 h-4" /> Ready for Onboarding
            </h2>
            <div className="space-y-4">
              {leads.map((lead) => (
                <div key={lead.id} className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{lead.name}</p>
                    <p className="text-[10px] font-black uppercase text-zinc-400">{lead.company || "Independent"}</p>
                  </div>
                  <form action={async () => {
                    "use server";
                    await startOnboardingSession(lead.id);
                  }}>
                    <button type="submit" className="bg-[#012169] text-white p-2 rounded-xl hover:bg-[#c8102e] transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ))}
              {leads.length === 0 && <p className="text-xs text-zinc-500 italic py-4">No new leads to onboard.</p>}
            </div>
          </div>

          <div className="p-6 rounded-[32px] bg-gradient-to-br from-blue-600 to-purple-700 text-white shadow-xl relative overflow-hidden">
            <Sparkles className="absolute -right-4 -top-4 w-24 h-24 opacity-10" />
            <h3 className="text-sm font-black uppercase tracking-widest mb-2 italic">Gemini Co-pilot</h3>
            <p className="text-xs font-medium opacity-90 leading-relaxed">
              Gemini is monitoring all chat boxes. It will automatically flag sessions where the client seems confused or unhappy.
            </p>
          </div>
        </div>

        {/* Right: Active Chat Boxes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-lg dark:border-white/5 dark:bg-zinc-900/50 relative group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#012169] flex items-center justify-center text-white font-black">
                      CB
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest">Chat Box #{session.id.slice(-4)}</p>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-zinc-500">Active</span>
                      </span>
                    </div>
                  </div>
                  <Link href={`/onboarding/${session.id}`} className="text-[10px] font-black uppercase tracking-widest text-[#012169] hover:underline">
                    Expand
                  </Link>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-white/5 h-32 overflow-hidden relative">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter mb-2">Latest Message</p>
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 line-clamp-3 italic">
                    &quot;{session.messages[0]?.content || "Waiting for interaction..."}&quot;
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent"></div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-200 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-black">AI</div>
                    <div className="w-6 h-6 rounded-full bg-[#012169] border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-black text-white">SA</div>
                  </div>
                  <button className="rounded-xl bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white dark:text-zinc-950 hover:scale-105 transition-all">
                    Take Over
                  </button>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="col-span-2 py-20 text-center rounded-[40px] border-4 border-dashed border-zinc-100 dark:border-white/5">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-zinc-300">No active chat boxes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
