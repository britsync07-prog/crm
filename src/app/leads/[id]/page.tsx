import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { convertLeadToCustomer, logInteraction, createTask, updateLeadStatus } from "@/app/actions";
import TaskToggle from "@/components/TaskToggle";
import LeadAIActions from "./LeadAIActions";
import { LEAD_STAGES } from "@/lib/crm-lifecycle";

interface LeadDetailsProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LeadDetails({ params }: LeadDetailsProps) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      interactions: {
        orderBy: { date: "desc" },
      },
      tasks: {
        orderBy: { createdAt: "desc" }
      },
      deals: {
        orderBy: { createdAt: "desc" }
      }
    },
  });

  if (!lead) {
    notFound();
  }

  const convertAction = convertLeadToCustomer.bind(null, lead.id);
  const stageOptions = Object.values(LEAD_STAGES);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 dark:border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/leads"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 shadow-sm"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic">{lead.name}</h1>
            <p className="text-zinc-500 font-medium mt-1">Lead from {lead.source || "Unknown Channel"}</p>
          </div>
        </div>
        <form action={convertAction}>
          <button
            type="submit"
            className="rounded-xl bg-[#012169] px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-[#c8102e] transition-all shadow-xl shadow-blue-900/20"
          >
            Convert to Customer
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (3) - Contact Info */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-zinc-950">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#012169] mb-6 italic">Entity Info</h2>
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Status</p>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-black uppercase text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 tracking-widest">
                  {lead.status}
                </span>
                <form action={updateLeadStatus} className="mt-3 flex gap-2">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <select
                    name="status"
                    defaultValue={lead.status}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[10px] font-black uppercase tracking-widest dark:border-white/10 dark:bg-zinc-900"
                  >
                    {stageOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white dark:bg-white dark:text-zinc-900"
                  >
                    Save
                  </button>
                </form>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Email</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{lead.email}</p>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Source</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{lead.source || "-"}</p>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Company</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{lead.company || "-"}</p>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">License / Industry</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{lead.licenseType || "-"}</p>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Area</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{lead.areaOfOperation || "-"}</p>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Deal Focus</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{lead.dealFocus || "-"}</p>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Budget</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{lead.budgetRange || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column (5) - Activity Timeline & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-zinc-950">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#012169] flex gap-4 mb-6 italic">
              Record Event
            </h2>
            <form action={logInteraction} className="space-y-4">
              <input type="hidden" name="leadId" value={lead.id} />
              <div className="grid grid-cols-2 gap-4">
                <select
                  name="type"
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold dark:border-white/5 dark:bg-white/5 outline-none"
                >
                  <option value="Note">Note</option>
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                </select>
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-50 hover:bg-zinc-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Log Event
                </button>
              </div>
              <textarea
                name="content"
                placeholder="What occurred during this interaction?"
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium dark:border-white/5 dark:bg-white/5 outline-none"
                rows={3}
              />
            </form>
          </div>

          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-zinc-950">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#012169] mb-6 italic">Activity Timeline</h2>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 dark:before:via-white/10 before:to-transparent">
              {lead.interactions.map((interaction) => (
                <div key={interaction.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-zinc-950 bg-blue-50 dark:bg-[#012169]/20 text-[#012169] dark:text-blue-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-[10px] font-black">
                    {interaction.type[0].toUpperCase()}
                  </div>

                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-zinc-900 dark:text-white">{interaction.type}</span>
                        {interaction.sentiment && (
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-sm font-black uppercase tracking-widest ${interaction.sentiment === 'Positive' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                              interaction.sentiment === 'Negative' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-zinc-200 text-zinc-700 dark:bg-white/10 dark:text-zinc-400'
                            }`}>
                            {interaction.sentiment}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase">{new Date(interaction.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">&quot;{interaction.content}&quot;</p>
                  </div>
                </div>
              ))}
              {lead.interactions.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center italic relative z-10 bg-white dark:bg-zinc-950">Timeline is quiet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4) - AI, Tasks, Deals */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[32px] bg-[#012169] p-8 shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full translate-x-1/4 -translate-y-1/4"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <LeadAIActions leadId={lead.id} />
              </div>
              <div className="flex items-end gap-2 text-white">
                <span className="text-5xl font-black italic">{lead.aiScore}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-2">/ 100 Sync Score</span>
              </div>
              <p className="mt-6 text-sm text-blue-100 leading-relaxed font-medium italic relative">
                <span className="absolute -left-3 -top-2 text-2xl opacity-20 font-serif">&quot;</span>
                {lead.aiInsights || "Awaiting neural analysis on this lead's interaction profile."}
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-zinc-950">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#012169] mb-6 italic">Control Sequence (Tasks)</h2>
            <form action={createTask} className="mb-6 flex gap-2">
              <input type="hidden" name="leadId" value={lead.id} />
              <input type="hidden" name="priority" value="Medium" />
              <input
                name="title"
                placeholder="New Task..."
                required
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold dark:border-white/5 dark:bg-white/5 outline-none"
              />
              <button type="submit" className="rounded-xl bg-zinc-900 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-50 hover:bg-zinc-800 dark:bg-white dark:text-black">
                Add
              </button>
            </form>
            <div className="space-y-3">
              {lead.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${task.priority === "High" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"}`} />
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[150px]">{task.title}</p>
                  </div>
                  <TaskToggle taskId={task.id} status={task.status} />
                </div>
              ))}
              {lead.tasks.length === 0 && <p className="text-xs text-zinc-500 italic py-2">No sequences active.</p>}
            </div>
          </div>

          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-zinc-950">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#012169] italic">Associated Deals</h2>
              <Link href="/deals/new" className="text-[10px] font-black uppercase text-zinc-400 hover:text-[#012169] tracking-widest transition-colors">+ Link</Link>
            </div>
            <div className="space-y-3">
              {lead.deals.map((deal) => (
                <div key={deal.id} className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 group hover:border-blue-700/30 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{deal.name}</p>
                    <span className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-200 dark:bg-white/10 px-2 py-0.5 rounded">{deal.probability}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#012169]">{deal.stage}</span>
                    <span className="text-sm font-black text-green-500">${deal.value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {lead.deals.length === 0 && <p className="text-xs text-zinc-500 italic py-2">No active pipeline deals.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
