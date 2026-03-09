import { prisma } from "./db";
import { runLeadScoringAgent, runCustomerSummaryAgent, runTaskActionExtractor } from "./ai-agents";

/**
 * Main Trigger Entry Point
 * Call this function whenever a system event occurs.
 */
export async function triggerAutomation(type: string, payload: any) {
  const automations = await prisma.automation.findMany({
    where: { triggerType: type, isActive: true },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  for (const automation of automations) {
    const startTime = Date.now();
    try {
      await executeWorkflow(automation, payload);
      
      await prisma.automationLog.create({
        data: {
          automationId: automation.id,
          status: "SUCCESS",
          executionTime: Date.now() - startTime,
        },
      });
    } catch (error: any) {
      await prisma.automationLog.create({
        data: {
          automationId: automation.id,
          status: "FAILURE",
          message: error.message,
          executionTime: Date.now() - startTime,
        },
      });
    }
  }
}

/**
 * Workflow Executor
 * Processes steps: Conditions, Actions, Delays, AI.
 */
async function executeWorkflow(automation: any, payload: any) {
  for (const step of automation.steps) {
    const config = JSON.parse(step.config);

    switch (step.type) {
      case "CONDITION":
        if (!evaluateCondition(config, payload)) {
          return; // Stop workflow if condition is not met
        }
        break;

      case "ACTION":
        await performAction(config, payload);
        break;

      case "DELAY":
        // In a real system, we would use a queue/worker.
        // For this demo, we use a simple sleep for small delays.
        await new Promise((r) => setTimeout(r, config.durationMs || 1000));
        break;

      case "AI_ACTION":
        await performAIAction(config, payload);
        break;
    }
  }
}

function evaluateCondition(config: any, payload: any) {
  const { field, operator, value } = config;
  const actualValue = payload[field];

  switch (operator) {
    case "EQUALS": return actualValue === value;
    case "CONTAINS": return String(actualValue).includes(value);
    case "GREATER_THAN": return actualValue > value;
    case "LESS_THAN": return actualValue < value;
    default: return true;
  }
}

async function performAction(config: any, payload: any) {
  const { actionType, data } = config;

  switch (actionType) {
    case "CREATE_TASK":
      await prisma.task.create({
        data: {
          title: data.title,
          description: data.description,
          customerId: payload.customerId || payload.id, // Assume lead id if no customer
          status: "Todo",
        },
      });
      break;

    case "SEND_EMAIL":
      console.log(`[Automation] Sending email to ${payload.email}: ${data.template}`);
      break;

    case "CREATE_INVOICE":
      if (payload.customerId) {
        await prisma.invoice.create({
          data: {
            invoiceRef: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            amount: data.amount || 0,
            customerId: payload.customerId,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          },
        });
      }
      break;
      
    case "ADD_TAG":
      // Implementation for adding tags...
      break;
  }
}

async function performAIAction(config: any, payload: any) {
  const { aiType } = config;

  switch (aiType) {
    case "SCORE_LEAD":
      if (payload.id) await runLeadScoringAgent(payload.id);
      break;
    case "SUMMARIZE_CUSTOMER":
      if (payload.customerId) await runCustomerSummaryAgent(payload.customerId);
      break;
    case "EXTRACT_TASKS":
      if (payload.taskId) await runTaskActionExtractor(payload.taskId);
      break;
  }
}
