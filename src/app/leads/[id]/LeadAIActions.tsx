"use client";

import { scoreLeadWithAI } from "@/app/ai-actions";
import AIActionButton from "@/components/AIActionButton";

export default function LeadAIActions({ leadId }: { leadId: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-400">AI Lead Insight</h2>
      <AIActionButton 
        label="Analyze" 
        action={() => scoreLeadWithAI(leadId)}
        modalTitle="Lead Intelligence Analysis"
        modalType="score"
        className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50"
      />
    </div>
  );
}
