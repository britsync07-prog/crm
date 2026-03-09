"use server";

import { revalidatePath } from "next/cache";
import { runLeadScoringAgent, runCustomerSummaryAgent, runTaskActionExtractor, generateColdEmail, runGeneralAIChat, generateRichHTMLEmail, runEmailArchitectChat } from "@/lib/ai-agents";

export async function scoreLeadWithAI(leadId: string) {
  const result = await runLeadScoringAgent(leadId);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return result;
}

export async function summarizeCustomerWithAI(customerId: string) {
  const result = await runCustomerSummaryAgent(customerId);
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
  return result;
}

export async function extractTaskActionsWithAI(taskId: string) {
  const result = await runTaskActionExtractor(taskId);
  revalidatePath("/tasks");
  return result;
}

export async function generateAIEmailTemplate(prompt: string) {
  return await generateColdEmail({
    audience: "Target Audience",
    industry: "General",
    offer: prompt,
    tone: "Professional, Convincing"
  });
}

export async function chatWithEmailArchitect(messages: { role: "user" | "model"; content: string }[]) {
  return await runEmailArchitectChat(messages);
}

export async function generateAIEmailHTML(prompt: string) {
  return await generateRichHTMLEmail({
    audience: "Target Audience",
    offer: prompt,
    tone: "Professional, Convincing"
  });
}

