"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function ActionModal({ isOpen, onClose, title, children }: ActionModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
