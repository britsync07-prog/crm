// Enterprise Tasks v2.0 - Forced Re-sync
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import KanbanBoard from "./KanbanBoard";
import { Plus, LayoutList, Calendar as CalendarIcon, Filter } from "lucide-react";
import Link from "next/link";

export default async function TasksPage() {
  const session = await getSession();
  const userId = session.id;

  // Use dynamic access to bypass stale dev server caches
  const tasks = await (prisma as any).task.findMany({
    where: { assigneeId: userId },
    include: {
      customer: true,
      project: true,
      lead: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 overflow-x-hidden h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-8 gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic">
            Command <span className="text-indigo-500 not-italic">&</span> Control
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Advanced Task & Project Management Engine.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm">
            <button className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center gap-2">
              <LayoutList className="w-4 h-4" /> Board
            </button>
            <button className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> Calendar
            </button>
          </div>
          <Link
            href="/tasks/new"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> New Task
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard initialTasks={tasks} />
      </div>
    </div>
  );
}
