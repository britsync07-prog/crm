"use client";

import { simulateEmailSending } from "@/app/campaign-actions";
import { useTransition, useState } from "react";

export default function SimulateOutreach({ campaignId }: { campaignId: string }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  const run = () => {
    setStatus("Processing batch...");
    startTransition(async () => {
      await simulateEmailSending(campaignId);
      setStatus("Batch complete! Check stats.");
      setTimeout(() => setStatus(null), 3000);
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={run}
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Sending..." : "🚀 Simulate Sending Batch"}
      </button>
      {status && <span className="text-[10px] font-bold text-blue-600">{status}</span>}
    </div>
  );
}
