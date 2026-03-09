"use client";

import { summarizeCustomerWithAI } from "@/app/ai-actions";
import AIActionButton from "@/components/AIActionButton";

export default function CustomerAIActions({ customerId }: { customerId: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-400">AI Relationship Summary</h2>
      <AIActionButton 
        label="Generate" 
        loadingLabel="Summarizing..."
        action={() => summarizeCustomerWithAI(customerId)}
        modalTitle="Customer Relationship Summary"
        modalType="summary"
        className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-800/50"
      />
    </div>
  );
}
