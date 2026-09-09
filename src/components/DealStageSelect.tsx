"use client";

import React, { useState, useTransition } from "react";
import { updateDealStageAction } from "@/app/actions";
import Link from "next/link";
import { CheckCircle2, ChevronDown, Sparkles, Trophy } from "lucide-react";

interface DealStageSelectProps {
  dealId: string;
  currentStage: string;
}

const STAGES = ["Discovery", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

export default function DealStageSelect({ dealId, currentStage }: DealStageSelectProps) {
  const [stage, setStage] = useState(currentStage || "Discovery");
  const [isPending, startTransition] = useTransition();
  const [onboardingId, setOnboardingId] = useState<string | null>(null);

  const isWon = stage.toLowerCase().includes("won");

  const handleStageChange = (newStage: string) => {
    setStage(newStage);
    startTransition(async () => {
      const res = await updateDealStageAction(dealId, newStage);
      if (res.success && res.onboardingResult?.onboardingId) {
        setOnboardingId(res.onboardingResult.onboardingId);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {!isWon ? (
          <button
            onClick={() => handleStageChange("Won")}
            disabled={isPending}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Mark deal as Won and auto-initiate AI Onboarding"
          >
            <Trophy className="w-3 h-3" />
            {isPending ? "Updating..." : "Mark Won"}
          </button>
        ) : (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Won
          </span>
        )}

        <div className="relative inline-block">
          <select
            value={stage}
            disabled={isPending}
            onChange={(e) => handleStageChange(e.target.value)}
            className="appearance-none bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 pr-6 text-[10px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-200 cursor-pointer disabled:opacity-50"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
        </div>
      </div>

      {onboardingId && (
        <Link
          href={`/onboarding/${onboardingId}`}
          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Sparkles className="w-3 h-3 text-purple-500" />
          AI Onboarding Initiated &rarr;
        </Link>
      )}
    </div>
  );
}
