"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getProgressiveQuestionsForClient, calculateOnboardingHealth } from "@/lib/onboarding/ai-engine";
import { logOnboardingAudit } from "@/lib/onboarding/audit";
import crypto from "crypto";

import { ensureOnboardingDatabaseSchema } from "@/lib/onboarding/db-init";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {}
}

/**
 * Validates token and returns all data required for the client portal.
 */
export async function getClientOnboardingData(token: string) {
  if (!token) return { success: false, error: "Invalid token" };

  await ensureOnboardingDatabaseSchema();

  const instance = await prisma.onboardingInstance.findUnique({
    where: { secureToken: token },
    include: {
      client: true,
      documents: {
        where: { status: { in: ["APPROVED", "SENT", "SIGNED"] } },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      },
      signatureRequests: {
        include: { signatories: true, document: true },
      },
      responses: true,
    },
  });

  if (!instance) {
    return { success: false, error: "Onboarding link is invalid or expired." };
  }

  if (new Date() > new Date(instance.tokenExpiresAt)) {
    return { success: false, error: "This secure onboarding link has expired. Please contact your account manager." };
  }

  const progressiveQuestions = await getProgressiveQuestionsForClient(instance.id);

  const commercial = instance.commercialDetails
    ? JSON.parse(instance.commercialDetails)
    : {};

  return {
    success: true,
    data: {
      id: instance.id,
      serviceName: instance.serviceName,
      status: instance.status,
      healthStatus: instance.healthStatus,
      progressPercentage: instance.progressPercentage,
      client: {
        name: instance.client.name,
        company: instance.client.company || instance.client.name,
        email: instance.client.email,
        phone: instance.client.phone,
      },
      commercial: {
        price: commercial.price,
        duration: commercial.duration,
        startDate: commercial.startDate,
        paymentTerms: commercial.paymentTerms,
        accountManager: commercial.accountManager,
      },
      invoice: {
        id: instance.invoiceId,
        amount: instance.invoiceAmount,
        status: instance.invoiceStatus,
      },
      documents: instance.documents.map((d) => ({
        id: d.id,
        title: d.title,
        documentType: d.documentType,
        status: d.status,
        content: d.versions[0]?.content || "",
      })),
      signatureRequests: instance.signatureRequests.map((s) => ({
        id: s.id,
        documentId: s.documentId,
        title: s.title,
        status: s.status,
        expiresAt: s.expiresAt,
        signatories: s.signatories.map((sig) => ({
          id: sig.id,
          name: sig.name,
          email: sig.email,
          status: sig.status,
          signedAt: sig.signedAt,
        })),
      })),
      responses: instance.responses.map((r) => ({
        key: r.questionKey,
        label: r.questionLabel,
        value: r.response,
        type: r.responseType,
      })),
      questions: progressiveQuestions,
    },
  };
}

/**
 * Client submits an answer to a progressive question.
 */
export async function submitClientResponseAction(
  token: string,
  questionKey: string,
  questionLabel: string,
  responseValue: any,
  responseType: string = "text"
) {
  try {
    const instance = await prisma.onboardingInstance.findUnique({
      where: { secureToken: token },
    });
    if (!instance) return { success: false, error: "Invalid token" };

    const serialized = typeof responseValue === "object" ? JSON.stringify(responseValue) : String(responseValue);
    const effectiveKey = questionKey || "general_response";

    // Upsert response
    const existing = await prisma.clientResponse.findFirst({
      where: { onboardingId: instance.id, questionKey: effectiveKey },
    });

    if (existing) {
      await prisma.clientResponse.update({
        where: { id: existing.id },
        data: { response: serialized, submittedAt: new Date() },
      });
    } else {
      await prisma.clientResponse.create({
        data: {
          onboardingId: instance.id,
          clientId: instance.clientId,
          questionKey: effectiveKey,
          questionLabel: questionLabel || effectiveKey,
          response: serialized,
          responseType,
          source: "PORTAL",
          verified: true,
        },
      });
    }

    await logOnboardingAudit({
      onboardingId: instance.id,
      actorType: "CLIENT",
      action: "CLIENT_QUESTION_ANSWERED",
      details: `Answered "${questionLabel}": ${serialized.slice(0, 80)}`,
    });

    await calculateOnboardingHealth(instance.id);

    safeRevalidate(`/onboarding/portal/${token}`);
    safeRevalidate(`/onboarding/${instance.id}`);
    return { success: true };
  } catch (err: any) {
    console.error("[submitClientResponseAction] Error:", err);
    return { success: false, error: err.message || "Failed to save response" };
  }
}

/**
 * Client signs a document digitally (DocuSign-style canvas or typed signature with legal consent & audit seal).
 */
export async function signDocumentAction(
  token: string,
  documentId: string,
  signatureData: {
    type: "DRAWN" | "TYPED";
    data: string;
    name: string;
    consent: boolean;
  }
) {
  try {
    let userAgent = "Web Browser / Device";
    let ipAddress = "127.0.0.1";
    try {
      const headerList = await headers();
      userAgent = headerList.get("user-agent") || userAgent;
      ipAddress = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || ipAddress;
    } catch {}

    if (!signatureData.consent) {
      return { success: false, error: "Legal consent acknowledgment is mandatory to execute digital signature." };
    }

    const instance = await prisma.onboardingInstance.findUnique({
      where: { secureToken: token },
    });
    if (!instance) return { success: false, error: "Invalid token" };

    const sigRequest = await prisma.signatureRequest.findFirst({
      where: { onboardingId: instance.id, documentId },
      include: { signatories: true },
    });

    if (!sigRequest) {
      return { success: false, error: "Signature request not found for this document." };
    }

    // Generate cryptographic tamper-evident verification seal
    const now = new Date();
    const auditHash = crypto
      .createHash("sha256")
      .update(`${instance.id}-${documentId}-${signatureData.name}-${now.toISOString()}-${ipAddress}`)
      .digest("hex");

    const auditCertificate = {
      signerName: signatureData.name,
      signatureType: signatureData.type,
      ipAddress,
      userAgent,
      signedAt: now.toISOString(),
      transactionId: `SIG-${auditHash.slice(0, 16).toUpperCase()}`,
      legalNotice: "Executed under the UK Electronic Communications Act 2000 & eIDAS Regulation.",
      auditHash,
    };

    // Update Signatory
    const signatory = sigRequest.signatories[0];
    if (signatory) {
      await prisma.signatory.update({
        where: { id: signatory.id },
        data: {
          name: signatureData.name,
          status: "SIGNED",
          signedAt: now,
          signatureType: signatureData.type,
          signatureData: signatureData.data,
          ipAddress,
          userAgent,
          consentGiven: true,
          consentTimestamp: now,
        },
      });
    }

    // Update SignatureRequest
    await prisma.signatureRequest.update({
      where: { id: sigRequest.id },
      data: {
        status: "SIGNED",
        completedAt: now,
        auditCertificate: JSON.stringify(auditCertificate),
      },
    });

    // Mark Document as SIGNED
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "SIGNED" },
    });

    await logOnboardingAudit({
      onboardingId: instance.id,
      actorType: "CLIENT",
      action: "DOCUMENT_DIGITALLY_SIGNED",
      details: `Signatory "${signatureData.name}" executed digital signature for "${sigRequest.title}". TransID: ${auditCertificate.transactionId}`,
      ipAddress,
      metadata: auditCertificate,
    });

    await calculateOnboardingHealth(instance.id);

    safeRevalidate(`/onboarding/portal/${token}`);
    safeRevalidate(`/onboarding/${instance.id}`);
    return { success: true, certificate: auditCertificate };
  } catch (err: any) {
    console.error("[signDocumentAction] Error:", err);
    return { success: false, error: err.message || "Failed to sign document" };
  }
}

/**
 * Client finishes all portal stages.
 */
export async function completeClientPortalAction(token: string) {
  try {
    const instance = await prisma.onboardingInstance.findUnique({
      where: { secureToken: token },
    });
    if (!instance) return { success: false, error: "Invalid token" };

    await prisma.onboardingInstance.update({
      where: { id: instance.id },
      data: {
        status: "READY_FOR_ACTIVATION",
        progressPercentage: 90,
      },
    });

    await logOnboardingAudit({
      onboardingId: instance.id,
      actorType: "CLIENT",
      action: "CLIENT_PORTAL_COMPLETED",
      details: "Client completed all onboarding portal steps. Ready for final internal review & activation.",
    });

    await calculateOnboardingHealth(instance.id);

    safeRevalidate(`/onboarding/portal/${token}`);
    safeRevalidate(`/onboarding/${instance.id}`);
    safeRevalidate("/onboarding");
    return { success: true };
  } catch (err: any) {
    console.error("[completeClientPortalAction] Error:", err);
    return { success: false, error: err.message || "Failed to complete onboarding" };
  }
}
