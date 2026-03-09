import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { createAdvancedTask } from "../actions";

export default async function NewTaskPage() {
  const session = await getSession();

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-white/5 pb-8">
        <Link
          href="/tasks"
          className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic">
            New Directive
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Assign a new task to your queue.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[32px] p-8 shadow-xl">
        <form action={createAdvancedTask} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Task Title</label>
            <input
              name="title"
              required
              placeholder="e.g. Finalize Q3 Marketing Assets"
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Provide strategic context..."
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Priority Level</label>
              <select
                name="priority"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
              >
                <option value="Low">Low</option>
                <option value="Medium" selected>Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Initial Status</label>
              <select
                name="status"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
              >
                <option value="Todo" selected>Todo</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-100 dark:border-white/5">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
            >
              <Save className="w-4 h-4" /> Deploy Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
