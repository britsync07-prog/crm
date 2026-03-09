"use client";

import { useState, useTransition } from "react";
import { updateTaskStatus, deleteTask } from "./actions";
import { CheckCircle2, Clock, AlertCircle, GripVertical, Trash2, Calendar } from "lucide-react";
import AIActionButton from "@/components/AIActionButton";
import { extractTaskActionsWithAI } from "@/app/ai-actions";

type Task = any; // Assuming full Task payload from Prisma with customer/project

const COLUMNS = ["Todo", "In Progress", "Review", "Done"];

export default function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isPending, startTransition] = useTransition();

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");

    if (!taskId) return;

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

    startTransition(() => {
      updateTaskStatus(taskId, status);
    });
  };

  const handleDelete = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    startTransition(() => {
      deleteTask(taskId);
    });
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-8 h-[calc(100vh-200px)] snap-x snap-mandatory hide-scrollbar">
      {COLUMNS.map(column => {
        const columnTasks = tasks.filter(t => t.status === column);

        return (
          <div
            key={column}
            className="min-w-[350px] w-[350px] flex-shrink-0 snap-center flex flex-col bg-zinc-50/50 dark:bg-white/[0.02] rounded-[32px] border border-zinc-200/50 dark:border-white/5"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column)}
          >
            <div className="p-6 border-b border-zinc-200/50 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-t-[32px]">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${column === "Todo" ? "bg-zinc-400" :
                    column === "In Progress" ? "bg-blue-500 animate-pulse" :
                      column === "Review" ? "bg-yellow-500" :
                        "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                  }`} />
                <h3 className="text-sm font-black uppercase tracking-widest">{column}</h3>
              </div>
              <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-white/10 px-3 py-1 rounded-full">{columnTasks.length}</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {columnTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="p-5 bg-white dark:bg-zinc-900 rounded-[24px] shadow-sm border border-zinc-200 dark:border-white/5 hover:border-indigo-500/50 hover:shadow-xl transition-all group cursor-grab active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-snug">{task.title}</h4>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {task.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-4">{task.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${task.priority === "Urgent" ? "bg-red-100 text-red-700" :
                        task.priority === "High" ? "bg-orange-100 text-orange-700" :
                          task.priority === "Medium" ? "bg-blue-100 text-blue-700" :
                            "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300"
                      }`}>
                      {task.priority}
                    </span>
                    {task.customer && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                        {task.customer.name}
                      </span>
                    )}
                    {task.lead && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                        {task.lead.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}
                      </span>
                    </div>

                    {!task.aiActionItems ? (
                      <AIActionButton
                        label="AI Subtasks"
                        loadingLabel="..."
                        action={async () => {
                          const result = await extractTaskActionsWithAI(task.id);
                          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, aiActionItems: result } : t));
                          return result;
                        }}
                        modalType="tasks"
                        className="text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-400 px-3 py-1.5 rounded-lg"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> AI Active
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {columnTasks.length === 0 && (
                <div className="h-full min-h-[200px] flex items-center justify-center flex-col opacity-30 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-[24px]">
                  <GripVertical className="w-6 h-6 text-zinc-400 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-center text-zinc-500">Drop tasks here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
