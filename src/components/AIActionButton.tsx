"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import AIResultModal from "./AIResultModal";

interface AIActionButtonProps {
  label: string;
  loadingLabel?: string;
  className?: string;
  icon?: React.ReactNode;
  action?: () => Promise<any>;
  modalTitle?: string;
  modalType?: "score" | "summary" | "tasks" | "general";
  type?: "button" | "submit" | "reset";
}

export default function AIActionButton({ 
  label, 
  loadingLabel = "Analyzing...", 
  className,
  icon = <Sparkles className="w-3 h-3" />,
  action,
  modalTitle = "AI Intelligence Report",
  modalType = "general",
  type = "submit"
}: AIActionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (action) {
      e.preventDefault();
      startTransition(async () => {
        try {
          const data = await action();
          if (data) {
            setResult(data);
            setIsModalOpen(true);
          }
        } catch (error) {
          console.error("Action failed:", error);
        }
      });
    }
  };

  return (
    <>
      <button
        type={type}
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50",
          className
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            {loadingLabel}
          </>
        ) : (
          <>
            {icon}
            {label}
          </>
        )}
      </button>

      <AIResultModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        result={result}
        type={modalType}
      />
    </>
  );
}
