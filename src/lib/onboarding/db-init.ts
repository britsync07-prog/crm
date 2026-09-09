import { prisma } from "@/lib/db";

let schemaInitialized = false;

/**
 * Automatically creates all onboarding tables in SQLite if they don't exist yet,
 * and seeds default service templates, document templates, and AI permission rules.
 * This guarantees that production servers (e.g. truecrm.online) never fail with
 * "no such table" after pulling new code.
 */
export async function ensureOnboardingDatabaseSchema() {
  if (schemaInitialized) return;

  try {
    // 1. ServiceOnboardingTemplate
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ServiceOnboardingTemplate" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "requiredDocumentsJson" TEXT NOT NULL DEFAULT '[]',
        "requiredInformationJson" TEXT NOT NULL DEFAULT '[]',
        "requiredSignaturesJson" TEXT NOT NULL DEFAULT '[]',
        "paymentRequirementsJson" TEXT NOT NULL DEFAULT '{}',
        "complianceRequirementsJson" TEXT NOT NULL DEFAULT '[]',
        "communicationSequenceJson" TEXT NOT NULL DEFAULT '[]',
        "completionConditionsJson" TEXT NOT NULL DEFAULT '[]',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ServiceOnboardingTemplate_code_key" ON "ServiceOnboardingTemplate"("code");
    `).catch(() => {});

    // 2. OnboardingInstance
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OnboardingInstance" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "clientId" TEXT NOT NULL,
        "opportunityId" TEXT,
        "serviceName" TEXT NOT NULL DEFAULT 'AI Automation Implementation',
        "templateId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'INITIALISING',
        "healthStatus" TEXT NOT NULL DEFAULT 'HEALTHY',
        "healthReason" TEXT,
        "progressPercentage" INTEGER NOT NULL DEFAULT 0,
        "onboardingOwnerId" TEXT,
        "commercialDetails" TEXT,
        "analysisJson" TEXT,
        "planJson" TEXT,
        "secureToken" TEXT NOT NULL,
        "tokenExpiresAt" DATETIME NOT NULL,
        "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "targetCompletionDate" DATETIME,
        "completedAt" DATETIME,
        "invoiceId" TEXT,
        "invoiceStatus" TEXT DEFAULT 'DRAFT',
        "invoiceAmount" REAL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "OnboardingInstance_secureToken_key" ON "OnboardingInstance"("secureToken");
    `).catch(() => {});

    // 3. AIAction
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AIAction" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "onboardingId" TEXT NOT NULL,
        "actionType" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "payload" TEXT NOT NULL,
        "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
        "requiresApproval" BOOLEAN NOT NULL DEFAULT 1,
        "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
        "approvedByUserId" TEXT,
        "approvedAt" DATETIME,
        "rejectionReason" TEXT,
        "executedAt" DATETIME,
        "executionResult" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    // 4. DocumentTemplate
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DocumentTemplate" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "variablesJson" TEXT NOT NULL DEFAULT '[]',
        "requiresApproval" BOOLEAN NOT NULL DEFAULT 1,
        "requiresSignature" BOOLEAN NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "DocumentTemplate_type_key" ON "DocumentTemplate"("type");
    `).catch(() => {});

    // 5. Document
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Document" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "onboardingId" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "templateId" TEXT,
        "documentType" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'DRAFT',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    // 6. DocumentVersion
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DocumentVersion" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "documentId" TEXT NOT NULL,
        "versionNumber" INTEGER NOT NULL DEFAULT 1,
        "content" TEXT NOT NULL,
        "generatedBy" TEXT NOT NULL DEFAULT 'AI',
        "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "approvedBy" TEXT,
        "approvedAt" DATETIME,
        "sentAt" DATETIME,
        "signedAt" DATETIME,
        "supersededBy" TEXT,
        "fileUrl" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    // 7. SignatureRequest
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SignatureRequest" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "onboardingId" TEXT NOT NULL,
        "documentId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'DRAFT',
        "token" TEXT NOT NULL,
        "expiresAt" DATETIME NOT NULL,
        "completedAt" DATETIME,
        "auditCertificate" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "SignatureRequest_token_key" ON "SignatureRequest"("token");
    `).catch(() => {});

    // 8. Signatory
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Signatory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "signatureRequestId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'Client Signer',
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "signedAt" DATETIME,
        "signatureType" TEXT,
        "signatureData" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "consentGiven" BOOLEAN NOT NULL DEFAULT 0,
        "consentTimestamp" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    // 9. ClientResponse
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ClientResponse" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "onboardingId" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "questionKey" TEXT NOT NULL,
        "questionLabel" TEXT NOT NULL,
        "response" TEXT NOT NULL,
        "responseType" TEXT NOT NULL DEFAULT 'text',
        "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "source" TEXT NOT NULL DEFAULT 'PORTAL',
        "verified" BOOLEAN NOT NULL DEFAULT 1
      );
    `).catch(() => {});

    // 10. OnboardingCommunication
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OnboardingCommunication" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "onboardingId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "recipientEmail" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
        "approvedBy" TEXT,
        "approvedAt" DATETIME,
        "sentAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    // 11. OnboardingAuditEvent
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OnboardingAuditEvent" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "onboardingId" TEXT NOT NULL,
        "actorId" TEXT NOT NULL,
        "actorType" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "details" TEXT NOT NULL,
        "metadataJson" TEXT,
        "ipAddress" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    // 12. OnboardingException
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OnboardingException" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "onboardingId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "severity" TEXT NOT NULL DEFAULT 'HIGH',
        "description" TEXT NOT NULL,
        "recommendedAction" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'OPEN',
        "assignedTo" TEXT,
        "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "resolvedAt" DATETIME,
        "resolvedBy" TEXT,
        "resolutionNotes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    // 13. AIPermissionSetting
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AIPermissionSetting" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "actionKey" TEXT NOT NULL,
        "actionName" TEXT NOT NULL,
        "aiAllowed" BOOLEAN NOT NULL DEFAULT 1,
        "humanApprovalRequired" BOOLEAN NOT NULL DEFAULT 1,
        "description" TEXT,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "AIPermissionSetting_actionKey_key" ON "AIPermissionSetting"("actionKey");
    `).catch(() => {});

    // Seed default permissions if empty
    const defaultPermissions = [
      ["perm_read_crm_data", "READ_CRM_DATA", "Read CRM data", 1, 0, "Allow AI to inspect customer, lead, and deal records."],
      ["perm_summarise_meeting", "SUMMARISE_MEETING", "Summarise meeting", 1, 0, "Allow AI to parse notes and generate summaries."],
      ["perm_create_internal_tasks", "CREATE_INTERNAL_TASKS", "Create internal tasks", 1, 0, "Allow AI to create operational setup tasks."],
      ["perm_generate_welcome", "GENERATE_WELCOME", "Generate welcome", 1, 1, "Generate client welcome letter draft."],
      ["perm_generate_nda", "GENERATE_NDA", "Generate NDA", 1, 1, "Generate Non-Disclosure Agreement draft."],
      ["perm_generate_agreement", "GENERATE_AGREEMENT", "Generate agreement", 1, 1, "Generate Master Service Agreement draft."],
      ["perm_generate_invoice", "GENERATE_INVOICE", "Generate invoice", 1, 1, "Generate advance onboarding deposit invoice."],
      ["perm_send_contract", "SEND_CONTRACT", "Send contract", 0, 1, "Dispatch binding contract to client."],
      ["perm_request_signature", "REQUEST_SIGNATURE", "Request signature", 0, 1, "Issue digital signature requests to external signers."],
      ["perm_send_payment_reminder", "SEND_PAYMENT_REMINDER", "Send payment reminder", 1, 1, "Dispatch payment reminder notice to client."],
      ["perm_change_price", "CHANGE_PRICE", "Change price", 0, 1, "Modify commercial pricing or discount values."],
      ["perm_change_contract", "CHANGE_CONTRACT", "Change contract", 0, 1, "Alter contractual clauses or terms."],
      ["perm_activate_client", "ACTIVATE_CLIENT", "Activate client", 0, 1, "Transition onboarding instance into Active Client status."],
      ["perm_create_followup", "CREATE_FOLLOWUP", "Create follow-up", 1, 0, "Prepare automated timeline follow-up reminders."],
    ];

    for (const [id, key, name, ai, human, desc] of defaultPermissions) {
      await prisma.$executeRawUnsafe(`
        INSERT OR IGNORE INTO "AIPermissionSetting" ("id", "actionKey", "actionName", "aiAllowed", "humanApprovalRequired", "description", "updatedAt")
        VALUES ('${id}', '${key}', '${name}', ${ai}, ${human}, '${String(desc).replace(/'/g, "''")}', CURRENT_TIMESTAMP);
      `).catch(() => {});
    }

    // Seed default document templates
    const defaultDocs = [
      ["dt_welcome_letter", "WELCOME_LETTER", "Client Welcome Letter", 1, 0, '["client_name","company","service_name","account_manager","start_date"]', "# Welcome to BritSync, {{client_name}}!\\n\\nDear {{client_name}},\\n\\nOn behalf of the entire team at BritSync, we are delighted to officially welcome **{{company}}** as our valued partner for **{{service_name}}**."],
      ["dt_nda", "NDA", "Mutual Non-Disclosure Agreement", 1, 1, '["client_name","company","effective_date","jurisdiction"]', "# MUTUAL NON-DISCLOSURE AGREEMENT\\n\\n**THIS AGREEMENT** is made on **{{effective_date}}** between BritSync AI Ltd and {{company}}."],
      ["dt_service_agreement", "SERVICE_AGREEMENT", "Master Services Agreement", 1, 1, '["client_name","company","service_name","price","currency","duration","start_date","payment_terms","advance_percent"]', "# MASTER SERVICES AGREEMENT\\n\\n**CLIENT:** {{company}}\\n**PROVIDER:** BritSync AI Ltd\\n**SERVICE:** {{service_name}}"],
      ["dt_dpa", "DPA", "Data Processing Addendum (GDPR)", 1, 0, '["company","effective_date"]', "# DATA PROCESSING ADDENDUM (GDPR)\\n\\n**Date:** {{effective_date}}\\n**Customer:** {{company}}"],
      ["dt_project_brief", "PROJECT_BRIEF", "Executive Project Brief", 1, 0, '["company","service_name","start_date","duration","account_manager","price"]', "# PROJECT BRIEF: {{service_name}}\\n\\n**Client:** {{company}}"],
      ["dt_kickoff_document", "KICKOFF_DOCUMENT", "Strategy Kickoff Agenda", 1, 0, '["client_name","company","service_name","start_date","account_manager"]', "# STRATEGY KICKOFF AGENDA\\n\\n**Client:** {{company}}"]
    ];

    for (const [id, type, name, reqApp, reqSig, vars, content] of defaultDocs) {
      await prisma.$executeRawUnsafe(`
        INSERT OR IGNORE INTO "DocumentTemplate" ("id", "type", "name", "requiresApproval", "requiresSignature", "variablesJson", "content", "isActive", "updatedAt")
        VALUES ('${id}', '${type}', '${name}', ${reqApp}, ${reqSig}, '${vars}', '${String(content).replace(/'/g, "''")}', 1, CURRENT_TIMESTAMP);
      `).catch(() => {});
    }

    schemaInitialized = true;
  } catch (err) {
    console.error("[ensureOnboardingDatabaseSchema] Unexpected error:", err);
  }
}
