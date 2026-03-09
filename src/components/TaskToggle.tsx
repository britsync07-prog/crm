"use client";

import { toggleTaskStatus } from "@/app/actions";
import { useTransition } from "react";

interface TaskToggleProps {
  taskId: string;
  status: string;
}

export default function TaskToggle({ taskId, status }: TaskToggleProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => toggleTaskStatus(taskId, status))}
      disabled={isPending}
      className={`rounded-full px-2 py-1 text-xs font-medium transition-opacity ${
        status === "Completed"
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
      } ${isPending ? "opacity-50" : "opacity-100"}`}
    >
      {isPending ? "Updating..." : status}
    </button>
  );
}
