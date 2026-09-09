
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
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OnboardingInstance_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OnboardingInstance_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Deal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "OnboardingInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ServiceOnboardingTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "OnboardingInstance_onboardingOwnerId_fkey" FOREIGN KEY ("onboardingOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "OnboardingInstance_secureToken_key" ON "OnboardingInstance"("secureToken");

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
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceOnboardingTemplate_code_key" ON "ServiceOnboardingTemplate"("code");

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
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIAction_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "OnboardingInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentTemplate_type_key" ON "DocumentTemplate"("type");

CREATE TABLE IF NOT EXISTS "Document" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "onboardingId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "templateId" TEXT,
  "documentType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Document_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "OnboardingInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Document_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SignatureRequest_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "OnboardingInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SignatureRequest_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "SignatureRequest_token_key" ON "SignatureRequest"("token");

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
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Signatory_signatureRequestId_fkey" FOREIGN KEY ("signatureRequestId") REFERENCES "SignatureRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
  "verified" BOOLEAN NOT NULL DEFAULT 1,
  CONSTRAINT "ClientResponse_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "OnboardingInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OnboardingCommunication_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "OnboardingInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "OnboardingAuditEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "onboardingId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorType" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "metadataJson" TEXT,
  "ipAddress" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OnboardingAuditEvent_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "OnboardingInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
