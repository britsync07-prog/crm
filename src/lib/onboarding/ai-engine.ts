import { prisma } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ContextAnalysisResult,
  InternalQuestion,
  ProgressiveQuestion,
  HealthCheckResult,
  CommercialDetails,
  AIActionType,
} from "./types";
import { findMatchingTemplate, ensureServiceTemplates } from "./service-templates";
import { ensureDocumentTemplates, interpolateVariables } from "./document-templates";
import { logOnboardingAudit } from "./audit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

async function callLLM(prompt: string, fallback: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) return fallback;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.replace(/```json|```markdown|```/g, "").trim();
  } catch (err) {
    console.error("[OnboardingAI] LLM error, using fallback:", err);
    return fallback;
  }
}

/**
 * 1. AI Initial Analysis: Classifies CRM data into Known, Missing, Verification, Optional
 */
export async function analyzeOnboardingContext(onboardingId: string): Promise<ContextAnalysisResult> {
  const instance = await prisma.onboardingInstance.findUnique({
    where: { id: onboardingId },
    include: {
      client: {
        include: {
          interactions: { take: 5, orderBy: { date: "desc" } },
        },
      },
      deal: true,
      template: true,
    },
  });

  if (!instance) throw new Error("Onboarding instance not found");

  // Attempt to link to lead data if available
  const lead = await prisma.lead.findFirst({
    where: {
      OR: [
        { email: instance.client.email },
        ...(instance.deal?.leadId ? [{ id: instance.deal.leadId }] : []),
      ],
    },
    include: { interactions: { take: 5, orderBy: { date: "desc" } } },
  });

  const known: Record<string, any> = {
    company: instance.client.company || lead?.company || "Independent Client",
    clientName: instance.client.name || lead?.name || "Client Lead",
    email: instance.client.email || lead?.email || "",
    phone: instance.client.phone || lead?.phone || null,
    serviceName: instance.serviceName,
    dealFocus: instance.client.dealFocus || lead?.dealFocus || null,
    budgetRange: instance.client.budgetRange || lead?.budgetRange || null,
    website: lead?.website || null,
    industry: lead?.industry || null,
    source: lead?.source || "CRM Opportunity",
    dealValue: instance.deal?.value && instance.deal.value > 0 ? instance.deal.value : null,
    leadScore: lead?.aiScore || null,
    recentNotes: [
      ...instance.client.interactions.map((i) => i.content),
      ...(lead?.interactions.map((i) => i.content) || []),
    ].slice(0, 3),
  };

  const missing: string[] = [];
  if (!known.dealValue && !instance.commercialDetails) missing.push("project_price");
  missing.push("project_duration");
  missing.push("start_date");
  missing.push("payment_terms");
  missing.push("account_manager");

  const verification: string[] = ["company_name", "primary_contact_email"];
  if (known.website) verification.push("website_url");

  const optional: string[] = ["special_conditions", "internal_notes", "custom_sla"];

  const summary = `${known.company} is ready for onboarding for ${known.serviceName}. ` +
    `We have reliable client and contact details. We need ${missing.length} commercial details from the internal team to prepare the onboarding plan and documents.`;

  const result: ContextAnalysisResult = {
    known,
    missing,
    verification,
    optional,
    summary,
  };

  await prisma.onboardingInstance.update({
    where: { id: onboardingId },
    data: {
      analysisJson: JSON.stringify(result),
      status: "WAITING_INTERNAL_INFORMATION",
    },
  });

  await logOnboardingAudit({
    onboardingId,
    actorType: "AI",
    action: "AI_INITIAL_ANALYSIS_COMPLETED",
    details: `AI identified ${Object.keys(known).length} known data points and flagged ${missing.length} missing internal items.`,
    metadata: result,
  });

  return result;
}

/**
 * 2. Generate dynamic internal questions for missing commercial/project details
 */
export async function getInternalQuestions(onboardingId: string): Promise<InternalQuestion[]> {
  const instance = await prisma.onboardingInstance.findUnique({
    where: { id: onboardingId },
    include: { template: true, deal: true },
  });
  if (!instance) throw new Error("Onboarding instance not found");

  let templateInfo: any = {};
  if (instance.template?.requiredInformationJson) {
    try {
      templateInfo = JSON.parse(instance.template.requiredInformationJson);
    } catch {}
  }

  const defaultQuestions: InternalQuestion[] = [
    {
      id: "price",
      key: "price",
      label: "Project Price (£)",
      type: "currency",
      required: true,
      defaultValue: instance.deal?.value && instance.deal.value > 0 ? instance.deal.value : 6000,
      helpText: "Total contracted price for the project",
    },
    {
      id: "duration",
      key: "duration",
      label: "Project Duration",
      type: "dropdown",
      required: true,
      defaultValue: "3 months",
      options: ["1 month", "2 months", "3 months", "6 months", "12 months", "Ongoing Retainer"],
    },
    {
      id: "startDate",
      key: "startDate",
      label: "Estimated Kickoff Date",
      type: "date",
      required: true,
      defaultValue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
    {
      id: "advancePaymentPercent",
      key: "advancePaymentPercent",
      label: "Upfront Deposit Required (%)",
      type: "dropdown",
      required: true,
      defaultValue: "50%",
      options: ["25%", "33%", "50%", "100%"],
    },
    {
      id: "paymentTerms",
      key: "paymentTerms",
      label: "Payment Terms",
      type: "dropdown",
      required: true,
      defaultValue: "Net 14",
      options: ["Due on Receipt", "Net 7", "Net 14", "Net 30"],
    },
    {
      id: "accountManager",
      key: "accountManager",
      label: "Assigned Lead / Account Manager",
      type: "text",
      required: true,
      defaultValue: "Lead Solutions Architect",
    },
    {
      id: "specialConditions",
      key: "specialConditions",
      label: "Any unusual conditions or notes?",
      type: "textarea",
      required: false,
      helpText: "Optional: Custom SLAs, non-standard IP rights, or API constraints",
    },
  ];

  if (templateInfo.internal && Array.isArray(templateInfo.internal)) {
    return templateInfo.internal;
  }

  return defaultQuestions;
}

/**
 * 3. AI Onboarding Planner: Synthesizes CRM + internal details -> produces structured Onboarding Plan & AIActions
 */
export async function generateOnboardingPlan(
  onboardingId: string,
  internalDetails: CommercialDetails
): Promise<any> {
  const instance = await prisma.onboardingInstance.findUnique({
    where: { id: onboardingId },
    include: { client: true, template: true },
  });
  if (!instance) throw new Error("Onboarding instance not found");

  await ensureDocumentTemplates();
  await ensureServiceTemplates();

  const price = Number(internalDetails.price || 6000);
  const duration = internalDetails.duration || "3 months";
  const startDate = internalDetails.startDate || new Date().toISOString().split("T")[0];
  const advancePercentStr = String(internalDetails.advancePaymentPercent || "50%").replace("%", "");
  const advancePercent = Number(advancePercentStr) || 50;
  const advanceAmount = Math.round((price * advancePercent) / 100);

  // Commercial Workstream
  const commercialPlan = {
    price,
    currency: "GBP",
    duration,
    startDate,
    advancePaymentPercent: advancePercent,
    advanceAmount,
    paymentTerms: internalDetails.paymentTerms || "Net 14",
    accountManager: internalDetails.accountManager || "Account Lead",
    notes: internalDetails.specialConditions || "",
  };

  // Legal Workstream
  const requiredDocs = instance.template?.requiredDocumentsJson
    ? JSON.parse(instance.template.requiredDocumentsJson)
    : ["WELCOME_LETTER", "NDA", "SERVICE_AGREEMENT", "DPA", "PROJECT_BRIEF"];

  const requiredSignatures = instance.template?.requiredSignaturesJson
    ? JSON.parse(instance.template.requiredSignaturesJson)
    : ["SERVICE_AGREEMENT", "NDA"];

  const planStructure = {
    client: instance.client.name,
    company: instance.client.company || "Independent",
    service: instance.serviceName,
    commercial: commercialPlan,
    legal: {
      documents: requiredDocs,
      signatures: requiredSignatures,
    },
    operational: {
      kickoffDate: startDate,
      accountManager: commercialPlan.accountManager,
      tasks: [
        "Provision secure client workspace",
        "Set up dedicated project repository and communication channel",
        "Schedule Technical Kickoff strategy call",
      ],
    },
    communication: {
      sequence: [
        "Welcome Letter & Overview",
        "Digital Signature Request for Service Agreement & NDA",
        "Deposit Invoice Notification",
        "Kickoff Confirmation",
      ],
    },
  };

  // Save commercial details and plan on instance
  await prisma.onboardingInstance.update({
    where: { id: onboardingId },
    data: {
      commercialDetails: JSON.stringify(commercialPlan),
      planJson: JSON.stringify(planStructure),
      status: "WAITING_HUMAN_APPROVAL",
      invoiceAmount: advanceAmount,
      progressPercentage: 25,
    },
  });

  // Delete previous pending actions if regenerating
  await prisma.aIAction.deleteMany({
    where: { onboardingId, status: "PENDING_APPROVAL" },
  });

  // Create explicit AIActions for human approval
  const actionsToCreate: Array<{
    actionType: AIActionType;
    description: string;
    payload: any;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    requiresApproval: boolean;
  }> = [];

  // Document actions
  for (const docType of requiredDocs) {
    const isSigned = requiredSignatures.includes(docType);
    actionsToCreate.push({
      actionType: "GENERATE_DOCUMENT",
      description: `Generate ${docType.replace(/_/g, " ")} (${isSigned ? "Digital Signature Required" : "Informational"})`,
      payload: {
        documentType: docType,
        clientName: instance.client.name,
        company: instance.client.company,
        serviceName: instance.serviceName,
        price,
        duration,
        startDate,
        requiresSignature: isSigned,
      },
      riskLevel: isSigned ? "HIGH" : "MEDIUM",
      requiresApproval: true,
    });
  }

  // Invoice action
  actionsToCreate.push({
    actionType: "CREATE_INVOICE",
    description: `Issue Advance Invoice for £${advanceAmount.toLocaleString()} (${advancePercent}% of £${price.toLocaleString()})`,
    payload: {
      clientId: instance.clientId,
      totalAmount: advanceAmount,
      currency: "GBP",
      terms: commercialPlan.paymentTerms,
      notes: `Advance payment deposit for ${instance.serviceName} (${duration})`,
    },
    riskLevel: "CRITICAL",
    requiresApproval: true,
  });

  // Digital signature request action
  if (requiredSignatures.length > 0) {
    actionsToCreate.push({
      actionType: "REQUEST_SIGNATURE",
      description: `Prepare digital signature package for ${requiredSignatures.join(" & ")}`,
      payload: {
        documents: requiredSignatures,
        signatoryName: instance.client.name,
        signatoryEmail: instance.client.email,
      },
      riskLevel: "CRITICAL",
      requiresApproval: true,
    });
  }

  // Communication actions
  actionsToCreate.push({
    actionType: "GENERATE_COMMUNICATION",
    description: `Send Onboarding Welcome Email & Secure Portal Link to ${instance.client.email}`,
    payload: {
      type: "WELCOME",
      recipient: instance.client.email,
      subject: `Welcome to BritSync — Onboarding for ${instance.serviceName}`,
    },
    riskLevel: "HIGH",
    requiresApproval: true,
  });

  // Internal tasks (automated approval)
  actionsToCreate.push({
    actionType: "CREATE_TASK",
    description: `Internal Task: Configure technical environment & kickoff prerequisites`,
    payload: {
      title: `Onboarding Setup: ${instance.client.company || instance.client.name}`,
      assignee: commercialPlan.accountManager,
      dueDate: startDate,
    },
    riskLevel: "LOW",
    requiresApproval: false,
  });

  for (const act of actionsToCreate) {
    await prisma.aIAction.create({
      data: {
        onboardingId,
        actionType: act.actionType,
        description: act.description,
        payload: JSON.stringify(act.payload),
        riskLevel: act.riskLevel,
        requiresApproval: act.requiresApproval,
        status: act.requiresApproval ? "PENDING_APPROVAL" : "APPROVED",
      },
    });
  }

  await logOnboardingAudit({
    onboardingId,
    actorType: "AI",
    action: "ONBOARDING_PLAN_GENERATED",
    details: `AI generated comprehensive onboarding plan with ${actionsToCreate.length} actionable items.`,
    metadata: planStructure,
  });

  return planStructure;
}

/**
 * 4. AI Document Generation: Safely interpolates pre-approved template without hallucinating legal language
 */
export async function renderDocumentForOnboarding(
  onboardingId: string,
  documentType: string
): Promise<{ title: string; content: string; templateId?: string }> {
  const instance = await prisma.onboardingInstance.findUnique({
    where: { id: onboardingId },
    include: { client: true },
  });
  if (!instance) throw new Error("Onboarding instance not found");

  const template = await prisma.documentTemplate.findUnique({
    where: { type: documentType },
  });

  const commercial: CommercialDetails = instance.commercialDetails
    ? JSON.parse(instance.commercialDetails)
    : {};

  const contextData: Record<string, any> = {
    client_name: instance.client.name,
    company: instance.client.company || instance.client.name,
    service_name: instance.serviceName,
    price: commercial.price ? commercial.price.toLocaleString() : "6,000",
    currency: commercial.currency || "£",
    duration: commercial.duration || "3 months",
    start_date: commercial.startDate || new Date().toISOString().split("T")[0],
    payment_terms: commercial.paymentTerms || "Net 14",
    advance_percent: commercial.advancePaymentPercent || 50,
    account_manager: commercial.accountManager || "Account Lead",
    effective_date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    jurisdiction: "England and Wales",
  };

  const rawTemplate = template?.content || `# ${documentType.replace(/_/g, " ")}\n\nDocument prepared for {{company}}.`;
  const renderedContent = interpolateVariables(rawTemplate, contextData);

  return {
    title: template?.name || documentType.replace(/_/g, " "),
    content: renderedContent,
    templateId: template?.id,
  };
}

/**
 * 5. Progressive Questioning: Returns next question batch with conditional branching
 */
export async function getProgressiveQuestionsForClient(onboardingId: string): Promise<ProgressiveQuestion[]> {
  const instance = await prisma.onboardingInstance.findUnique({
    where: { id: onboardingId },
    include: { template: true },
  });
  if (!instance) throw new Error("Onboarding instance not found");

  const responses = await prisma.clientResponse.findMany({
    where: { onboardingId },
  });

  const responseMap: Record<string, any> = {};
  for (const r of responses) {
    try {
      responseMap[r.questionKey] = JSON.parse(r.response);
    } catch {
      responseMap[r.questionKey] = r.response;
    }
  }

  let clientQuestions: ProgressiveQuestion[] = [];
  if (instance.template?.requiredInformationJson) {
    try {
      const parsed = JSON.parse(instance.template.requiredInformationJson);
      if (Array.isArray(parsed.client)) {
        clientQuestions = parsed.client;
      }
    } catch {}
  }

  // Filter based on conditions
  const activeQuestions = clientQuestions.filter((q) => {
    if (!q.condition) return true;
    const parentVal = responseMap[q.condition.dependsOnKey];
    return parentVal === q.condition.equals;
  });

  return activeQuestions;
}

/**
 * 6. Health & Exception Scoring: Analyzes SLA, pending items, overdue invoices, and exceptions
 */
export async function calculateOnboardingHealth(onboardingId: string): Promise<HealthCheckResult> {
  const instance = await prisma.onboardingInstance.findUnique({
    where: { id: onboardingId },
    include: {
      actions: true,
      documents: true,
      responses: true,
      signatureRequests: { include: { signatories: true } },
    },
  });

  if (!instance) throw new Error("Onboarding instance not found");

  const exceptions: HealthCheckResult["exceptions"] = [];
  const now = Date.now();
  const startedTime = new Date(instance.startedAt).getTime();
  const hoursSinceStart = (now - startedTime) / (1000 * 60 * 60);

  // Check 1: Waiting on internal information for > 24 hours
  if (instance.status === "WAITING_INTERNAL_INFORMATION" && hoursSinceStart > 24) {
    exceptions.push({
      type: "INTERNAL_INPUT_DELAY",
      severity: "MEDIUM",
      description: `Waiting for internal commercial details for ${Math.round(hoursSinceStart)} hours.`,
      recommendedAction: "Notify account owner to provide project price and timeline.",
    });
  }

  // Check 2: Unapproved high-risk actions pending > 24 hours
  const pendingActions = instance.actions.filter((a) => a.status === "PENDING_APPROVAL");
  if (pendingActions.length > 0 && hoursSinceStart > 12) {
    exceptions.push({
      type: "APPROVAL_PENDING",
      severity: "HIGH",
      description: `${pendingActions.length} AI-generated actions are awaiting human approval.`,
      recommendedAction: "Review and approve pending actions in the AI Approval Centre.",
    });
  }

  // Check 3: Digital signature pending > 48 hours
  const pendingSignatures = instance.signatureRequests.filter((s) => s.status === "SENT" || s.status === "READY");
  for (const sig of pendingSignatures) {
    const sigAgeHours = (now - new Date(sig.createdAt).getTime()) / (1000 * 60 * 60);
    if (sigAgeHours > 48) {
      exceptions.push({
        type: "SIGNATURE_OVERDUE",
        severity: "HIGH",
        description: `Signature request "${sig.title}" has been pending client execution for ${Math.round(sigAgeHours)} hours.`,
        recommendedAction: "Send polite signature follow-up reminder.",
      });
    }
  }

  // Check 4: Invoicing status
  if (instance.invoiceStatus === "DRAFT" && instance.status === "WAITING_CLIENT") {
    exceptions.push({
      type: "INVOICE_NOT_ISSUED",
      severity: "MEDIUM",
      description: "Advance deposit invoice has not yet been issued to the client.",
      recommendedAction: "Issue and dispatch BritLedger invoice.",
    });
  }

  // Calculate Progress Percentage
  let progress = 10; // Started
  if (instance.commercialDetails) progress += 20; // Internal info provided
  const approvedActions = instance.actions.filter((a) => a.status === "APPROVED" || a.status === "EXECUTED");
  if (instance.actions.length > 0) {
    progress += Math.round((approvedActions.length / instance.actions.length) * 20);
  }
  const signedDocs = instance.signatureRequests.filter((s) => s.status === "SIGNED");
  if (instance.signatureRequests.length > 0 && signedDocs.length === instance.signatureRequests.length) {
    progress += 25;
  }
  if (instance.responses.length > 0) progress += 15;
  if (instance.invoiceStatus === "PAID") progress += 10;
  progress = Math.min(100, Math.max(progress, 0));

  let healthStatus: "HEALTHY" | "AT_RISK" | "BLOCKED" = "HEALTHY";
  let healthReason = "Onboarding is progressing smoothly according to target timeline.";

  if (exceptions.some((e) => e.severity === "HIGH")) {
    healthStatus = "AT_RISK";
    healthReason = exceptions.find((e) => e.severity === "HIGH")?.description || "High priority item requires attention.";
  }
  if (exceptions.length >= 3 || instance.status === "BLOCKED") {
    healthStatus = "BLOCKED";
    healthReason = "Multiple critical bottlenecks are preventing onboarding completion.";
  }

  let recommendedNextAction = "Proceed with scheduled onboarding milestones.";
  if (exceptions.length > 0) {
    recommendedNextAction = exceptions[0].recommendedAction;
  } else if (instance.status === "WAITING_INTERNAL_INFORMATION") {
    recommendedNextAction = "Supply missing commercial variables (price, timeline, AM).";
  } else if (instance.status === "WAITING_HUMAN_APPROVAL") {
    recommendedNextAction = "Review and approve prepared actions in AI Approval Centre.";
  } else if (instance.status === "READY_FOR_ACTIVATION") {
    recommendedNextAction = "All requirements satisfied. Click 'Activate Client' to complete onboarding.";
  }

  // Update instance health in DB
  await prisma.onboardingInstance.update({
    where: { id: onboardingId },
    data: {
      healthStatus,
      healthReason,
      progressPercentage: progress,
      ...(progress >= 90 && instance.status !== "COMPLETED" ? { status: "READY_FOR_ACTIVATION" } : {}),
    },
  });

  return {
    healthStatus,
    healthReason,
    exceptions,
    recommendedNextAction,
    progressPercentage: progress,
  };
}

/**
 * 7. AI Summary Generator: Produces live 360 executive brief for Client 360 view
 */
export async function generateClientOnboardingSummary(onboardingId: string): Promise<string> {
  const instance = await prisma.onboardingInstance.findUnique({
    where: { id: onboardingId },
    include: {
      client: true,
      documents: { select: { title: true, status: true } },
      signatureRequests: { select: { title: true, status: true } },
      responses: true,
    },
  });

  if (!instance) return "No onboarding record found.";

  const commercial: CommercialDetails = instance.commercialDetails
    ? JSON.parse(instance.commercialDetails)
    : {};

  const signed = instance.signatureRequests.filter((s) => s.status === "SIGNED").map((s) => s.title);
  const pendingSign = instance.signatureRequests.filter((s) => s.status !== "SIGNED").map((s) => s.title);
  const priceStr = commercial.price ? `£${commercial.price.toLocaleString()}` : "To be confirmed";

  const prompt = `Write a crisp, professional 4-5 line executive summary for this client onboarding:
  Client: ${instance.client.name} (${instance.client.company})
  Service: ${instance.serviceName}
  Price: ${priceStr} over ${commercial.duration || "TBD"}
  Health Status: ${instance.healthStatus} (${instance.healthReason || "Healthy"})
  Signed Documents: ${signed.join(", ") || "None yet"}
  Pending Items: ${pendingSign.join(", ") || "None"}
  Invoice Status: ${instance.invoiceStatus || "Draft"}
  Progress: ${instance.progressPercentage}%
  
  Format like:
  "[Company] purchased [Service] for [Price] over [Duration].
  Agreement and NDA: [status].
  Invoice: [status].
  Outstanding: [bottleneck or none].
  Recommended Next Action: [action]."`;

  const fallbackSummary = `${instance.client.company || instance.client.name} purchased ${instance.serviceName} for ${priceStr} over ${commercial.duration || "3 months"}. ` +
    `Agreements: ${signed.length > 0 ? signed.join(", ") + " signed" : "Pending execution"}. ` +
    `Deposit Invoice: ${instance.invoiceStatus || "DRAFT"}. ` +
    `Outstanding: ${pendingSign.length > 0 ? pendingSign.join(", ") : "None"}. ` +
    `Health: ${instance.healthStatus}. Next action: ${instance.healthReason || "Monitor progress"}.`;

  return callLLM(prompt, fallbackSummary);
}

/**
 * 8. AI Communication Generator: Generates personalized client communication drafts
 */
export async function generateClientCommunication(
  onboardingId: string,
  commType: "WELCOME" | "SIGNATURE_REQUEST" | "PAYMENT_REMINDER" | "KICKOFF" | "DELAY_NOTICE"
): Promise<{ subject: string; body: string }> {
  const instance = await prisma.onboardingInstance.findUnique({
    where: { id: onboardingId },
    include: { client: true },
  });
  if (!instance) throw new Error("Onboarding instance not found");

  const commercial: CommercialDetails = instance.commercialDetails
    ? JSON.parse(instance.commercialDetails)
    : {};

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/onboarding/portal/${instance.secureToken}`;

  switch (commType) {
    case "WELCOME":
      return {
        subject: `Welcome to BritSync — Beginning Your ${instance.serviceName} Project`,
        body: `Dear ${instance.client.name},\n\nWe are delighted to welcome ${instance.client.company || instance.client.name} to BritSync. We are ready to begin your ${instance.serviceName} implementation.\n\nTo ensure a rapid kickoff, we have set up your dedicated Client Onboarding Portal. It takes approximately 3 minutes to confirm your details, review agreements, and specify your technical preferences:\n\n${portalUrl}\n\nYour designated lead is ${commercial.accountManager || "your Account Lead"}.\n\nWarm regards,\nBritSync Operations Team`,
      };
    case "SIGNATURE_REQUEST":
      return {
        subject: `Action Required: Please Review and Sign Your ${instance.serviceName} Agreement`,
        body: `Dear ${instance.client.name},\n\nYour Service Agreement and NDA for ${instance.serviceName} are now ready for your review and digital signature.\n\nYou can securely review and sign the documents directly on your computer or mobile device using the link below:\n\n${portalUrl}\n\nThank you for your prompt execution so we can confirm your start date of ${commercial.startDate || "next week"}.\n\nBest regards,\nBritSync Operations`,
      };
    case "PAYMENT_REMINDER":
      return {
        subject: `Invoice Available: ${instance.serviceName} Project Deposit`,
        body: `Dear ${instance.client.name},\n\nYour advance deposit invoice of £${(instance.invoiceAmount || 0).toLocaleString()} for ${instance.serviceName} has been generated.\n\nYou can review your invoice details in your onboarding portal:\n\n${portalUrl}\n\nPayment terms: ${commercial.paymentTerms || "Net 14"}.\n\nThank you,\nBritSync Accounts Department`,
      };
    case "KICKOFF":
      return {
        subject: `Confirmed: Kickoff Meeting for ${instance.serviceName}`,
        body: `Dear ${instance.client.name},\n\nAll onboarding requirements for ${instance.client.company || instance.client.name} have been satisfied! We are excited to officially begin delivery.\n\nYour Strategy Kickoff session is scheduled for ${commercial.startDate || "the agreed kickoff date"}.\n\nWe look forward to working with you,\n${commercial.accountManager || "BritSync Delivery Team"}`,
      };
    default:
      return {
        subject: `Update regarding your ${instance.serviceName} onboarding`,
        body: `Dear ${instance.client.name},\n\nPlease review your onboarding portal for important project updates:\n\n${portalUrl}\n\nBest regards,\nBritSync Team`,
      };
  }
}
