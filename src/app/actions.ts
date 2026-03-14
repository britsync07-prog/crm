"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runLeadScoringAgent, analyzeSentimentReal, runCustomerSummaryAgent, runTaskActionExtractor } from "@/lib/ai-agents";
import { triggerAutomation } from "@/lib/automation-engine";
import { getSession } from "@/lib/auth";
import { LEAD_STAGES, type LeadStage, ensureCustomerFromLead, transitionLeadStage } from "@/lib/crm-lifecycle";

export async function createCustomer(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const company = formData.get("company") as string;
  const phone = formData.get("phone") as string;
  const licenseType = formData.get("licenseType") as string;
  const areaOfOperation = formData.get("areaOfOperation") as string;
  const dealFocus = formData.get("dealFocus") as string;
  const budgetRange = formData.get("budgetRange") as string;

  const customer = await prisma.customer.create({
    data: {
      userId: session.id,
      name,
      email,
      company,
      phone,
      licenseType,
      areaOfOperation,
      dealFocus,
      budgetRange,
      status: "Active",
    },
  });

  await triggerAutomation("CUSTOMER_CREATED", customer);

  revalidatePath("/customers");
  redirect("/customers");
}

export async function createLead(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const source = formData.get("source") as string;
  const company = formData.get("company") as string;
  const licenseType = formData.get("licenseType") as string;
  const areaOfOperation = formData.get("areaOfOperation") as string;
  const dealFocus = formData.get("dealFocus") as string;
  const budgetRange = formData.get("budgetRange") as string;

  const lead = await prisma.lead.create({
    data: {
      userId: session.id,
      name,
      email,
      source,
      company,
      licenseType,
      areaOfOperation,
      dealFocus,
      budgetRange,
      status: LEAD_STAGES.NEW,
    },
  });

  await runLeadScoringAgent(lead.id);
  await triggerAutomation("LEAD_CREATED", lead);

  revalidatePath("/leads");
  redirect("/leads");
}

export async function convertLeadToCustomer(leadId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.userId !== session.id) return;

  const customer = await ensureCustomerFromLead(lead.id, session.id);
  if (!customer) return;

  await triggerAutomation("DEAL_CLOSED", { ...customer, leadSource: lead.source });

  revalidatePath("/leads");
  revalidatePath("/customers");
  redirect("/customers");
}

export async function logInteraction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const type = formData.get("type") as string;
  const content = formData.get("content") as string;
  const customerId = formData.get("customerId") as string;
  const leadId = formData.get("leadId") as string;

  const sentiment = await analyzeSentimentReal(content);

  const interaction = await prisma.interaction.create({
    data: {
      type,
      content,
      sentiment,
      customerId: customerId || null,
      leadId: leadId || null,
    },
  });

  await triggerAutomation("INTERACTION_LOGGED", interaction);

  if (leadId && (type === "Call" || type === "Email" || type === "Meeting")) {
    await transitionLeadStage({
      leadId,
      nextStage: LEAD_STAGES.CONTACTED,
      reason: `Outreach interaction logged (${type})`,
    });
  }

  if (customerId) {
    await runCustomerSummaryAgent(customerId);
    revalidatePath(`/customers/${customerId}`);
  }
  if (leadId) {
    await runLeadScoringAgent(leadId);
    revalidatePath(`/leads/${leadId}`);
  }
}

export async function updateLeadStatus(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const leadId = formData.get("leadId") as string;
  const nextStatus = formData.get("status") as string;
  if (!leadId || !nextStatus) return;
  if (!Object.values(LEAD_STAGES).includes(nextStatus as LeadStage)) return;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, userId: true },
  });
  if (!lead || lead.userId !== session.id) return;

  await transitionLeadStage({
    leadId,
    nextStage: nextStatus as LeadStage,
    reason: "Manual status update by user",
    force: true,
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}

export async function createTask(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string;
  const dueDate = formData.get("dueDate") as string;
  const customerId = formData.get("customerId") as string;
  const leadId = formData.get("leadId") as string;

  const task = await (prisma.task as any).create({
    data: {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      customerId: customerId || null,
      leadId: leadId || null,
      assigneeId: session.id,
      status: "Todo",
    },
  });

  await runTaskActionExtractor(task.id);
  await triggerAutomation("TASK_CREATED", task);

  revalidatePath("/tasks");
  if (customerId) revalidatePath(`/customers/${customerId}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

export async function toggleTaskStatus(taskId: string, currentStatus: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const newStatus = currentStatus === "Done" || currentStatus === "Completed" ? "Todo" : "Done";

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus },
  });

  await triggerAutomation("TASK_STATUS_CHANGED", task);

  revalidatePath("/tasks");
  revalidatePath("/customers");
}
