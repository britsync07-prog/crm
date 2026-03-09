"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  result: any;
  type?: "score" | "summary" | "tasks" | "general";
}

export default function AIResultModal({ 
  isOpen, 
  onClose, 
  title, 
  result,
  type = "general"
}: AIResultModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-indigo-50/30 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic">{title}</h2>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">AI Intelligence Report</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white dark:hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6">
          {type === "score" && result && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-zinc-100 dark:text-white/5"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * (result.score || 0)) / 100}
                      className="text-indigo-600 transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <span className="absolute text-2xl font-black italic">{result.score}%</span>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white">Lead Quality Index</h3>
                  <p className="text-sm text-zinc-500">Calculated based on engagement DNA and source verification.</p>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 italic text-sm leading-relaxed">
                "{result.insights}"
              </div>
            </div>
          )}

          {type === "summary" && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-500">Executive Summary</h3>
              <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed italic">
                "{result}"
              </p>
            </div>
          )}

          {type === "tasks" && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-500">Action Plan</h3>
              <div className="space-y-3">
                {String(result).split('\n').map((item, i) => (
                  <div key={i} className="flex gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10 group hover:border-indigo-500/30 transition-all">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{item.replace('- ', '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === "general" && (
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/10">
               <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 italic">
                 {result}
               </pre>
            </div>
          )}
        </div>

        <div className="p-8 bg-zinc-50/50 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-white/5">
          <button 
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
          >
            Acknowledge Intelligence
          </button>
        </div>
      </div>
    </div>
  );
}
