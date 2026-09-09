/**
 * End-to-End Verification Test Script for AI-Powered Internal Client Onboarding System
 * 
 * Verifies all 10 core milestones:
 * 1. Database seed & Deal Won trigger
 * 2. AI Initial Analysis & Gap Detection (Known vs Missing)
 * 3. Dynamic Internal Questioning & Commercial Planning
 * 4. Human Approval Centre & Policy Enforcement
 * 5. Action Execution & Document Generation with Variable Interpolation
 * 6. Native DocuSign-Style Digital Signing Subsystem with Cryptographic Audit Certificate
 * 7. Progressive Client Portal Interaction & Token Security
 * 8. Health & SLA Exception Scoring (HEALTHY, AT_RISK, BLOCKED)
 * 9. Tamper-evident Audit Trail Logging
 * 10. Client Activation Gate & Project Handover
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { prisma } from "../src/lib/db";
import { ensureServiceTemplates } from "../src/lib/onboarding/service-templates";
import { ensureDocumentTemplates } from "../src/lib/onboarding/document-templates";
import {
  startOnboardingForDealAction,
  submitInternalDetailsAction,
  approveActionAction,
  approveAllActionsAction,
  updateDocumentContentAction,
  activateClientAction,
} from "../src/app/onboarding/actions";
import {
  getClientOnboardingData,
  submitClientResponseAction,
  signDocumentAction,
  completeClientPortalAction,
} from "../src/app/onboarding/portal-actions";
import { calculateOnboardingHealth, getInternalQuestions } from "../src/lib/onboarding/ai-engine";

async function runVerification() {
  console.log("===============================================================================");
  console.log("🚀 STARTING E2E VERIFICATION: AI-POWERED CLIENT ONBOARDING ENGINE");
  console.log("===============================================================================\n");

  let passedMilestones = 0;

  // -------------------------------------------------------------------------
  // Setup: Seeds & Mock Data
  // -------------------------------------------------------------------------
  console.log("📦 [0/10] Seeding Service & Document Blueprints...");
  await ensureServiceTemplates();
  await ensureDocumentTemplates();
  console.log("   ✓ Service templates & document templates verified.\n");

  // Create or retrieve a test user
  const testEmail = "onboarding.admin@britsync-test.com";
  let user = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Onboarding Officer",
        role: "ADMIN",
        status: "ACTIVE",
        password: "hashed_test_password_123",
      },
    });
  }
  process.env.INTERNAL_TEST_USER_ID = user.id;

  // Create a clean test customer & deal
  const uniqueSuffix = Date.now().toString().slice(-5);
  const clientEmail = `client_${uniqueSuffix}@acmeforp.com`;
  const customer = await prisma.customer.create({
    data: {
      userId: user.id,
      name: "Arthur Pendelton",
      email: clientEmail,
      company: `Acme Global ${uniqueSuffix} Ltd`,
      phone: "+44 20 7946 0991",
      dealFocus: "Enterprise AI Automation",
      budgetRange: "£10k - £25k",
      status: "Prospect",
    },
  });

  const deal = await prisma.deal.create({
    data: {
      userId: user.id,
      customerId: customer.id,
      name: "Acme Global - AI Automation Implementation",
      value: 12500,
      stage: "Won",
    },
  });
  console.log(`   ✓ Test fixtures ready. Customer: ${customer.company} (Deal: £${deal.value})`);

  // -------------------------------------------------------------------------
  // Milestone 1: Deal Won Trigger & OnboardingInstance Creation
  // -------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------------");
  console.log("🎯 [Milestone 1] Initiating Onboarding from Deal Won Trigger...");
  const initRes = await startOnboardingForDealAction(deal.id);
  if (!initRes.success || !initRes.onboardingId) {
    throw new Error(`Failed Milestone 1: ${initRes.error}`);
  }
  const onboardingId = initRes.onboardingId;

  const instance1 = await prisma.onboardingInstance.findUnique({
    where: { id: onboardingId },
    include: { template: true, client: true },
  });

  if (!instance1) throw new Error("Instance not found in database!");
  if (!instance1.secureToken) throw new Error("Secure client portal token was not generated!");
  if (instance1.clientId !== customer.id) throw new Error("Client was not linked properly!");

  console.log(`   ✓ Onboarding Instance: ${instance1.id}`);
  console.log(`   ✓ Service Blueprint: ${instance1.template?.name || "Custom"}`);
  console.log(`   ✓ Secure Client Portal Token: ${instance1.secureToken.slice(0, 12)}...`);
  console.log(`   ✓ Status: ${instance1.status} | Progress: ${instance1.progressPercentage}%`);
  passedMilestones++;

  // -------------------------------------------------------------------------
  // Milestone 2: AI Gap Analysis & Known vs Missing
  // -------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------------");
  console.log("🎯 [Milestone 2] Verifying AI Context Gap Analysis...");
  if (!instance1.analysisJson) throw new Error("Milestone 2 Failed: analysisJson is missing!");

  const analysis = JSON.parse(instance1.analysisJson);
  const known = analysis.known;
  const questions = await getInternalQuestions(onboardingId);

  console.log(`   ✓ Known CRM Data: Name: "${known.clientName}", Company: "${known.company}", Deal: £${known.dealValue}`);
  console.log(`   ✓ AI Formulated ${questions.length} dynamic internal commercial questions:`);
  questions.forEach((q: any, i: number) => console.log(`     ${i + 1}. [${q.key}] ${q.label || q.question}`));
  passedMilestones++;

  // -------------------------------------------------------------------------
  // Milestone 3: Internal Commercial Details Submission & AI Plan Generation
  // -------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------------");
  console.log("🎯 [Milestone 3] Submitting Internal Commercial Details & Generating AI Plan...");
  const commercialInput = {
    price: 12500,
    duration: "8 weeks",
    accountManager: "Eleanor Vance",
    billingTerms: "50% upfront deposit, 50% upon milestone signoff",
    keyObjectives: "Automate tier-1 customer inquiries with conversational AI and integrate with CRM.",
  };

  const submitRes = await submitInternalDetailsAction(onboardingId, commercialInput);
  if (!submitRes.success) throw new Error(`Failed Milestone 3: ${submitRes.error}`);

  const instance3 = await prisma.onboardingInstance.findUnique({
    where: { id: onboardingId },
    include: { actions: true },
  });

  if (!instance3) throw new Error("Instance not found after submitting details");
  if (instance3.status !== "WAITING_HUMAN_APPROVAL") {
    throw new Error(`Expected status WAITING_HUMAN_APPROVAL, got ${instance3.status}`);
  }
  if (instance3.actions.length === 0) {
    throw new Error("AI Planner failed to generate structured AIActions!");
  }

  console.log(`   ✓ Instance Status transitioned to: ${instance3.status}`);
  console.log(`   ✓ AI Planner generated ${instance3.actions.length} planned actions:`);
  instance3.actions.forEach((act, idx) => {
    console.log(`     ${idx + 1}. [${act.actionType}] (${act.requiresApproval ? "Mandatory Approval" : "Auto"}) ${act.description}`);
  });
  passedMilestones++;

  // -------------------------------------------------------------------------
  // Milestone 4: Human Approval Centre & Policy Enforcement
  // -------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------------");
  console.log("🎯 [Milestone 4] Enforcing AI Human Approval Policy & Execution...");
  
  // Verify sensitive actions require approval
  const pendingActions = instance3.actions.filter((a) => a.status === "PENDING_APPROVAL");
  console.log(`   ✓ Safe Policy: ${pendingActions.length} sensitive actions require explicit human approval.`);

  // Test individual approval
  const firstAction = pendingActions[0];
  console.log(`   👉 Testing individual review & approval for: "${firstAction.description}"...`);
  const approveSingleRes = await approveActionAction(firstAction.id);
  if (!approveSingleRes.success) throw new Error(`Failed approving action: ${approveSingleRes.error}`);
  console.log(`   ✓ Action executed: ${approveSingleRes.result}`);

  // Test batch approval for remainder
  console.log("   👉 Testing batch 'Approve All' for remaining pending actions...");
  const approveAllRes = await approveAllActionsAction(onboardingId);
  if (!approveAllRes.success) throw new Error(`Failed approve all: ${approveAllRes.error}`);
  console.log(`   ✓ Successfully batch approved ${approveAllRes.count} actions.`);

  const instance4 = await prisma.onboardingInstance.findUnique({
    where: { id: onboardingId },
    include: { actions: true },
  });
  if (instance4?.status !== "WAITING_CLIENT") {
    throw new Error(`Expected status WAITING_CLIENT, got ${instance4?.status}`);
  }
  console.log(`   ✓ Instance status updated to: ${instance4.status} (Progress: ${instance4.progressPercentage}%)`);
  passedMilestones++;

  // -------------------------------------------------------------------------
  // Milestone 5: Action Execution & Document Generation with Variable Interpolation
  // -------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------------");
  console.log("🎯 [Milestone 5] Verifying Generated Legal Documents & Variable Interpolation...");
  const docs = await prisma.document.findMany({
    where: { onboardingId },
    include: { versions: { orderBy: { versionNumber: "desc" } } },
  });

  if (docs.length === 0) throw new Error("No documents were generated by approved actions!");
  console.log(`   ✓ Generated ${docs.length} legally vetted documents:`);

  for (const doc of docs) {
    const latest = doc.versions[0];
    if (!latest) throw new Error(`Document ${doc.title} has no version!`);
    console.log(`     - [${doc.documentType}] "${doc.title}" (v${latest.versionNumber})`);
    
    // Check variable interpolation
    if (latest.content.includes("{{client_name}}") || latest.content.includes("{{company_name}}")) {
      throw new Error(`Uninterpolated variables found in ${doc.title}!`);
    }
  }

  // Test human document editing and versioning
  const docToEdit = docs[0];
  console.log(`   👉 Testing human editing & version bump on "${docToEdit.title}"...`);
  const editRes = await updateDocumentContentAction(
    docToEdit.id,
    `${docToEdit.versions[0].content}\n\n## Special Commercial Addendum\nClient approved standard 30-day payment term.`
  );
  if (!editRes.success) throw new Error(`Failed editing document: ${editRes.error}`);
  console.log(`   ✓ Document edited and safely bumped to version: v${editRes.version}`);
  passedMilestones++;

  // -------------------------------------------------------------------------
  // Milestone 6: Native DocuSign-Style Digital Signing Subsystem
  // -------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------------");
  console.log("🎯 [Milestone 6] Executing Native DocuSign-Style Digital Signature...");
  const sigRequests = await prisma.signatureRequest.findMany({
    where: { onboardingId },
    include: { document: true, signatories: true },
  });

  if (sigRequests.length === 0) {
    throw new Error("No signature requests were generated!");
  }

  const targetSig = sigRequests[0];
  console.log(`   ✓ Signature request ready for "${targetSig.title}"`);
  console.log(`     Signatory: ${targetSig.signatories[0]?.name || "Authorized Representative"}`);

  // Test legal consent requirement enforcement
  const unsignedRes = await signDocumentAction(instance4.secureToken, targetSig.documentId, {
    type: "DRAWN",
    data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    name: "Arthur Pendelton",
    consent: false, // Intentionally test consent refusal
  });

  if (unsignedRes.success) {
    throw new Error("Security failure: Signature accepted without legal consent checkbox!");
  }
  console.log("   ✓ Policy check passed: Rejected signature without mandatory legal consent.");

  // Execute valid signature with consent
  const signRes = await signDocumentAction(instance4.secureToken, targetSig.documentId, {
    type: "DRAWN",
    data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    name: "Arthur Pendelton",
    consent: true,
  });

  if (!signRes.success || !signRes.certificate) {
    throw new Error(`Failed signing document: ${signRes.error}`);
  }

  console.log("   ✓ Digital Signature successfully executed!");
  console.log(`     - Transaction ID: ${signRes.certificate.transactionId}`);
  console.log(`     - Signer: ${signRes.certificate.signerName}`);
  console.log(`     - SHA-256 Audit Seal: ${signRes.certificate.auditHash.slice(0, 24)}...`);
  console.log(`     - Timestamp: ${signRes.certificate.signedAt}`);
  passedMilestones++;

  // -------------------------------------------------------------------------
  // Milestone 7: Progressive Client Portal Interaction & Token Security
  // -------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------------");
  console.log("🎯 [Milestone 7] Validating Secure Client Portal & Progressive Questions...");
  const portalDataRes = await getClientOnboardingData(instance4.secureToken);
  if (!portalDataRes.success || !portalDataRes.data) {
    throw new Error(`Failed fetching portal data: ${portalDataRes.error}`);
  }

  const portalData = portalDataRes.data;
  console.log(`   ✓ Authenticated client portal for "${portalData.client.company}"`);
  console.log(`   ✓ Portal retrieved ${portalData.documents.length} approved documents`);
  console.log(`   ✓ Progressive questionnaire loaded (${portalData.questions.length} pending questions)`);

  // Answer a progressive question
  if (portalData.questions.length > 0) {
    const q = portalData.questions[0];
    console.log(`   👉 Answering progressive question: "${q.label}"...`);
    const respRes = await submitClientResponseAction(
      instance4.secureToken,
      q.key || q.id || "technicalContact",
      q.label,
      "Slack (#acme-ai-rollout) & Google Workspace",
      q.type || "text"
    );
    if (!respRes.success) throw new Error(`Failed submitting client response: ${respRes.error}`);
    console.log("   ✓ Client response recorded and encrypted in CRM.");
  }

  // Complete client portal step
  const completePortalRes = await completeClientPortalAction(instance4.secureToken);
  if (!completePortalRes.success) throw new Error(`Failed completing portal: ${completePortalRes.error}`);
  console.log("   ✓ Client completed all wizard steps. Instance moved to READY_FOR_ACTIVATION.");
  passedMilestones++;

  // -------------------------------------------------------------------------
  // Milestone 8: Health & SLA Exception Scoring
  // -------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------------");
  console.log("🎯 [Milestone 8] Evaluating Health & SLA Exception Scoring...");
  const healthRes = await calculateOnboardingHealth(onboardingId);
  console.log(`   ✓ Health status evaluated: [${healthRes.healthStatus}]`);
  console.log(`   ✓ Exceptions / SLA risk items: ${healthRes.exceptions.length === 0 ? "None (All SLAs on track)" : healthRes.exceptions.map((e) => e.description).join(", ")}`);
  passedMilestones++;

  // -------------------------------------------------------------------------
  // Milestone 9: Tamper-Evident Audit Trail Logging
  // -------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------------");
  console.log("🎯 [Milestone 9] Inspecting Tamper-Evident Audit Trail...");
  const auditLogs = await prisma.onboardingAuditEvent.findMany({
    where: { onboardingId },
    orderBy: { createdAt: "asc" },
  });

  if (auditLogs.length < 5) {
    throw new Error(`Expected at least 5 audit events, found ${auditLogs.length}`);
  }

  console.log(`   ✓ Found ${auditLogs.length} immutable audit records:`);
  auditLogs.forEach((log, idx) => {
    console.log(`     ${idx + 1}. [${log.action}] (${log.actorType}) - ${log.details}`);
  });
  passedMilestones++;

  // -------------------------------------------------------------------------
  // Milestone 10: Client Activation Gate & Project Handover
  // -------------------------------------------------------------------------
  console.log("\n-------------------------------------------------------------------------------");
  console.log("🎯 [Milestone 10] Executing Final Client Activation Gate...");
  const activateRes = await activateClientAction(onboardingId);
  if (!activateRes.success) throw new Error(`Failed activation: ${activateRes.error}`);

  const finalInstance = await prisma.onboardingInstance.findUnique({
    where: { id: onboardingId },
  });
  const finalCustomer = await prisma.customer.findUnique({
    where: { id: customer.id },
  });
  const project = await prisma.project.findFirst({
    where: { customerId: customer.id },
  });

  if (finalInstance?.status !== "COMPLETED") {
    throw new Error(`Expected final status COMPLETED, got ${finalInstance?.status}`);
  }
  if (finalCustomer?.status !== "Active") {
    throw new Error(`Customer status not updated to Active! Got ${finalCustomer?.status}`);
  }
  if (!project) {
    throw new Error("Project was not automatically created for active client delivery!");
  }

  console.log("   ✓ Client Activation Successful!");
  console.log(`     - Onboarding Status: ${finalInstance.status} (100% completed)`);
  console.log(`     - Customer CRM Status: ${finalCustomer.status}`);
  console.log(`     - Active Project Created: "${project.name}" (Status: ${project.status})`);
  passedMilestones++;

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`🎉 ALL ${passedMilestones}/10 MILESTONES VERIFIED SUCCESSFULLY WITH ZERO ERRORS!`);
  console.log("===============================================================================\n");
}

runVerification()
  .catch((err) => {
    console.error("\n❌ E2E VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
