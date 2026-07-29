import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, ArrowLeft, Clock, Bot } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OnboardingSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const onboardingSession = await prisma.onboardingSession.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  const lead = (onboardingSession && onboardingSession.leadId)
    ? await prisma.lead.findUnique({ where: { id: onboardingSession.leadId } })
    : null;

  if (!onboardingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0f0f10] p-4">
        <div className="text-center space-y-6">
          <h1 className="text-2xl font-black italic text-zinc-900 dark:text-zinc-50 uppercase tracking-tighter">Session Not Found</h1>
          <p className="text-sm text-zinc-500">This onboarding session does not exist.</p>
          <Link href="/onboarding" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#012169] hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10 animate-in fade-in duration-700 pb-32">
      <div className="flex items-center justify-between">
        <Link href="/onboarding" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#012169] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-zinc-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {onboardingSession.messages.length} Messages
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-[2rem] bg-[#012169] flex items-center justify-center shadow-2xl">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase leading-none">
            Onboarding Session
          </h1>
          {lead && (
            <p className="text-[10px] font-black uppercase tracking-widest text-[#012169] mt-2">
              Lead: {lead.name}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {onboardingSession.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-5 ${msg.sender === "AI" || msg.sender === "CLIENT" ? "" : "flex-row-reverse"}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${msg.sender === "AI" || msg.sender === "CLIENT" ? "bg-[#012169]" : "bg-zinc-100 dark:bg-zinc-800"}`}>
              <Bot className={`w-5 h-5 ${msg.sender === "AI" || msg.sender === "CLIENT" ? "text-white" : "text-zinc-500"}`} />
            </div>
            <div className={`flex-1 p-6 rounded-2xl border shadow-lg ${
              msg.sender === "AI" || msg.sender === "CLIENT"
                ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                : "bg-[#012169]/5 border-[#012169]/10"
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                  {msg.sender}
                </span>
                <span className="text-[9px] text-zinc-300">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {onboardingSession.messages.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">No messages yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
