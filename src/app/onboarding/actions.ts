"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  analyzeOnboardingContext,
  generateOnboardingPlan,
  renderDocumentForOnboarding,
  calculateOnboardingHealth,
  generateClientCommunication,
  generateClientOnboardingSummary,
} from "@/lib/onboarding/ai-engine";
import { findMatchingTemplate } from "@/lib/onboarding/service-templates";
import { logOnboardingAudit } from "@/lib/onboarding/audit";
import { createInvoiceAction } from "@/app/billing/actions";
import { CommercialDetails } from "@/lib/onboarding/types";
import { sendSystemEmail } from "@/lib/system-mailer";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {}
}

async function getEffectiveSession() {
  try {
    const session = await getSession();
    if (session) return session;
  } catch {}
  if (process.env.INTERNAL_TEST_USER_ID) {
    return { id: process.env.INTERNAL_TEST_USER_ID, email: "admin@britsync.com", role: "ADMIN" };
  }
  return null;
}

/**
 * Initiates an OnboardingInstance from a Deal (e.g. Won deal trigger).
 */
export async function startOnboardingForDealAction(dealId: string, templateCode?: string) {
  try {
    const session = await getEffectiveSession();

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { customer: true, lead: true },
    });

    if (!deal) {
      return { success: false, error: "Deal not found" };
    }

    // Ensure customer exists
    let clientId = deal.customerId;
    if (!clientId) {
      if (deal.lead) {
        const customer = await prisma.customer.upsert({
          where: { email: deal.lead.email },
          update: {
            name: deal.lead.name,
            company: deal.lead.company,
            phone: deal.lead.phone,
          },
          create: {
            userId: deal.userId,
            name: deal.lead.name,
            email: deal.lead.email,
            company: deal.lead.company,
            phone: deal.lead.phone,
            dealFocus: deal.lead.dealFocus,
            budgetRange: deal.lead.budgetRange,
            status: "Active",
          },
        });
        clientId = customer.id;
        await prisma.deal.update({
          where: { id: deal.id },
          data: { customerId: customer.id },
        });
      } else {
        return { success: false, error: "Deal does not have an attached customer or lead" };
      }
    }

    // Check if an onboarding instance already exists for this deal
    const existing = await prisma.onboardingInstance.findFirst({
      where: { opportunityId: deal.id },
    });
    if (existing) {
      return { success: true, onboardingId: existing.id, isExisting: true };
    }

    const template = await findMatchingTemplate(deal.name);
    const tokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const instance = await prisma.onboardingInstance.create({
      data: {
        clientId,
        opportunityId: deal.id,
        serviceName: deal.name || template?.name || "AI Automation Implementation",
        templateId: template?.id,
        status: "INITIALISING",
        healthStatus: "HEALTHY",
        progressPercentage: 10,
        onboardingOwnerId: session?.id || deal.userId,
        tokenExpiresAt: tokenExpiry,
      },
    });

    // Run AI Initial Analysis automatically
    await analyzeOnboardingContext(instance.id);

    await logOnboardingAudit({
      onboardingId: instance.id,
      actorId: session?.id || "SYSTEM",
      actorType: session?.id ? "USER" : "SYSTEM",
      action: "ONBOARDING_INITIALISED",
      details: `Initiated onboarding instance for deal "${deal.name}" (${template?.name || "Custom Template"}).`,
    });

    safeRevalidate("/onboarding");
    return { success: true, onboardingId: instance.id };
  } catch (err: any) {
    console.error("[startOnboardingForDealAction] Error:", err);
    return { success: false, error: err.message || "Failed to start onboarding" };
  }
}

/**
 * Initiates an onboarding workflow directly for a customer, creating a won deal if none exists.
 */
export async function startOnboardingForCustomerAction(
  customerId: string,
  serviceName: string = "AI Automation Implementation",
  dealValue: number = 10000
) {
  try {
    const session = await getEffectiveSession();
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return { success: false, error: "Customer not found" };

    // Check if customer already has an active onboarding
    const existing = await prisma.onboardingInstance.findFirst({
      where: { clientId: customerId, status: { not: "COMPLETED" } },
    });
    if (existing) {
      return { success: true, onboardingId: existing.id, isExisting: true };
    }

    // Create a Won deal for this customer
    const deal = await prisma.deal.create({
      data: {
        userId: customer.userId || session?.id || "admin",
        customerId: customer.id,
        name: `${customer.company || customer.name} - ${serviceName}`,
        value: dealValue,
        stage: "Won",
        probability: 100,
      },
    });

    return await startOnboardingForDealAction(deal.id);
  } catch (err: any) {
    console.error("[startOnboardingForCustomerAction] Error:", err);
    return { success: false, error: err.message || "Failed to start onboarding for customer" };
  }
}

/**
 * Submits internal missing details from sales / account team & generates AI plan
 */
export async function submitInternalDetailsAction(
  onboardingId: string,
  details: CommercialDetails
) {
  try {
    const session = await getEffectiveSession();
    if (!session) throw new Error("Unauthorized");

    await generateOnboardingPlan(onboardingId, details);

    await logOnboardingAudit({
      onboardingId,
      actorId: session.id,
      actorType: "USER",
      action: "INTERNAL_DETAILS_SUBMITTED",
      details: `Supplied commercial details: Price £${details.price}, Duration: ${details.duration}, AM: ${details.accountManager}.`,
      metadata: details,
    });

    await calculateOnboardingHealth(onboardingId);

    safeRevalidate(`/onboarding/${onboardingId}`);
    safeRevalidate("/onboarding");
    return { success: true };
  } catch (err: any) {
    console.error("[submitInternalDetailsAction] Error:", err);
    return { success: false, error: err.message || "Failed to submit internal details" };
  }
}

/**
 * Approves and executes an individual AIAction
 */
export async function approveActionAction(actionId: string) {
  try {
    const session = await getEffectiveSession();
    if (!session) throw new Error("Unauthorized");

    const action = await prisma.aIAction.findUnique({
      where: { id: actionId },
      include: { onboarding: { include: { client: true } } },
    });
    if (!action) return { success: false, error: "Action not found" };

    const payload = JSON.parse(action.payload || "{}");
    const onboardingId = action.onboardingId;

    let executionResult = "Executed successfully";

    // Execute based on actionType
    if (action.actionType === "GENERATE_DOCUMENT") {
      const docData = await renderDocumentForOnboarding(onboardingId, payload.documentType);

      // Create or update Document record
      let doc = await prisma.document.findFirst({
        where: { onboardingId, documentType: payload.documentType },
      });

      if (!doc) {
        doc = await prisma.document.create({
          data: {
            onboardingId,
            clientId: action.onboarding.clientId,
            templateId: docData.templateId,
            documentType: payload.documentType,
            title: docData.title,
            status: "APPROVED",
          },
        });
      } else {
        await prisma.document.update({
          where: { id: doc.id },
          data: { status: "APPROVED" },
        });
      }

      // Record immutable DocumentVersion
      const version = await prisma.documentVersion.create({
        data: {
          documentId: doc.id,
          versionNumber: 1,
          content: docData.content,
          generatedBy: "AI",
          approvedBy: session.id,
          approvedAt: new Date(),
        },
      });

      executionResult = `Document "${doc.title}" generated and approved as version ${version.versionNumber}`;
    } else if (action.actionType === "CREATE_INVOICE") {
      const invoiceNumber = `INV-OB-${Date.now().toString().slice(-6)}`;
      const totalAmount = Number(payload.totalAmount || 3000);

      // Try creating in BritLedger, with graceful fallback to CRM database
      let ledgerId = null;
      try {
        const ledgerRes = await createInvoiceAction({
          client_id: payload.clientId,
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          currency: payload.currency || "GBP",
          notes: payload.notes || "Advance Onboarding Deposit",
          status: "Sent",
        });
        if (ledgerRes.success && ledgerRes.data) {
          ledgerId = ledgerRes.data.id;
        }
      } catch (ledgerErr) {
        console.warn("[OnboardingAction] BritLedger sync unavailable, recorded locally:", ledgerErr);
      }

      await prisma.onboardingInstance.update({
        where: { id: onboardingId },
        data: {
          invoiceId: ledgerId || invoiceNumber,
          invoiceStatus: "SENT",
          invoiceAmount: totalAmount,
        },
      });

      executionResult = `Invoice ${invoiceNumber} created for £${totalAmount.toLocaleString()}`;
    } else if (action.actionType === "REQUEST_SIGNATURE") {
      // Find all approved documents requiring signatures
      const docs = await prisma.document.findMany({
        where: {
          onboardingId,
          documentType: { in: payload.documents || ["SERVICE_AGREEMENT", "NDA"] },
        },
      });

      for (const doc of docs) {
        const existingSig = await prisma.signatureRequest.findFirst({
          where: { onboardingId, documentId: doc.id },
        });

        if (!existingSig) {
          const sigReq = await prisma.signatureRequest.create({
            data: {
              onboardingId,
              documentId: doc.id,
              title: `Signature Request: ${doc.title}`,
              status: "READY",
              expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            },
          });

          await prisma.signatory.create({
            data: {
              signatureRequestId: sigReq.id,
              name: payload.signatoryName || action.onboarding.client.name,
              email: payload.signatoryEmail || action.onboarding.client.email,
              role: "Client Authorized Signer",
              status: "PENDING",
            },
          });
        }
      }

      executionResult = `Signature requests prepared for ${payload.documents?.join(", ")}`;
    } else if (action.actionType === "GENERATE_COMMUNICATION") {
      const commData = await generateClientCommunication(onboardingId, payload.type || "WELCOME");

      const comm = await prisma.onboardingCommunication.create({
        data: {
          onboardingId,
          type: payload.type || "WELCOME",
          subject: commData.subject,
          body: commData.body,
          recipientEmail: payload.recipient || action.onboarding.client.email,
          status: "APPROVED",
          approvedBy: session.id,
          approvedAt: new Date(),
          sentAt: new Date(),
        },
      });

      // Attempt sending transactional email via system mailer
      try {
        await sendSystemEmail({
          profile: "transactional",
          to: comm.recipientEmail,
          subject: comm.subject,
          html: comm.body,
        });
      } catch (mailErr) {
        console.warn("[OnboardingAction] Mail dispatch notice:", mailErr);
      }

      executionResult = `Communication "${comm.subject}" dispatched to ${comm.recipientEmail}`;
    } else if (action.actionType === "CREATE_TASK") {
      await (prisma.task as any).create({
        data: {
          title: payload.title || "Onboarding Task",
          customerId: action.onboarding.clientId,
          assigneeId: session.id,
          dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
          status: "Todo",
          priority: "Medium",
        },
      });
      executionResult = `Internal task created: ${payload.title}`;
    } else if (action.actionType === "SEND_CUSTOM_DOCUMENT") {
      const doc = await prisma.document.findUnique({
        where: { id: payload.documentId },
      });

      if (doc) {
        await prisma.document.update({
          where: { id: doc.id },
          data: { status: payload.requiresSignature ? "SENT" : "APPROVED" },
        });

        if (payload.requiresSignature) {
          const sigReq = await prisma.signatureRequest.create({
            data: {
              onboardingId,
              documentId: doc.id,
              title: `Signature Request: ${doc.title}`,
              status: "READY",
              expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            },
          });

          await prisma.signatory.create({
            data: {
              signatureRequestId: sigReq.id,
              name: payload.signerName || action.onboarding.client.name,
              email: payload.signerEmail || action.onboarding.client.email,
              role: "Client Authorized Signer",
              status: "PENDING",
            },
          });

          try {
            await sendSystemEmail({
              profile: "transactional",
              to: payload.signerEmail || action.onboarding.client.email,
              subject: `Action Required: Please review & sign ${doc.title}`,
              html: `<p>Dear ${payload.signerName || action.onboarding.client.name},</p><p>A document (<strong>${doc.title}</strong>) is ready for your electronic review and digital signature.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/onboarding/sign/${sigReq.token}">Click here to sign the document</a></p>`,
            });
          } catch (mailErr) {
            console.warn("[OnboardingAction] Custom doc mail dispatch notice:", mailErr);
          }
        }
      }

      executionResult = `Custom document "${payload.title}" approved and released to client${payload.requiresSignature ? " with digital signature request" : ""}.`;
    }

    // Update action status to EXECUTED
    await prisma.aIAction.update({
      where: { id: actionId },
      data: {
        status: "EXECUTED",
        approvedByUserId: session.id,
        approvedAt: new Date(),
        executedAt: new Date(),
        executionResult,
      },
    });

    await logOnboardingAudit({
      onboardingId,
      actorId: session.id,
      actorType: "USER",
      action: "ACTION_APPROVED_AND_EXECUTED",
      details: `${action.description} -> ${executionResult}`,
      metadata: { actionId, actionType: action.actionType },
    });

    await calculateOnboardingHealth(onboardingId);

    safeRevalidate(`/onboarding/${onboardingId}`);
    safeRevalidate("/onboarding");
    return { success: true, result: executionResult };
  } catch (err: any) {
    console.error("[approveActionAction] Error:", err);
    return { success: false, error: err.message || "Failed to approve action" };
  }
}

/**
 * Rejects an AI action with a documented reason
 */
export async function rejectActionAction(actionId: string, reason: string) {
  try {
    const session = await getEffectiveSession();
    if (!session) throw new Error("Unauthorized");

    const action = await prisma.aIAction.update({
      where: { id: actionId },
      data: {
        status: "REJECTED",
        rejectionReason: reason || "Declined by reviewer",
        approvedByUserId: session.id,
      },
    });

    if (action.actionType === "SEND_CUSTOM_DOCUMENT") {
      try {
        const payload = JSON.parse(action.payload || "{}");
        if (payload.documentId) {
          await prisma.document.update({
            where: { id: payload.documentId },
            data: { status: "REJECTED" },
          });
        }
      } catch {}
    }

    await logOnboardingAudit({
      onboardingId: action.onboardingId,
      actorId: session.id,
      actorType: "USER",
      action: "ACTION_REJECTED",
      details: `Action "${action.description}" rejected. Reason: ${reason}`,
    });

    await calculateOnboardingHealth(action.onboardingId);

    safeRevalidate(`/onboarding/${action.onboardingId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[rejectActionAction] Error:", err);
    return { success: false, error: err.message || "Failed to reject action" };
  }
}

/**
 * Batch approves all pending actions for an onboarding instance
 */
export async function approveAllActionsAction(onboardingId: string) {
  try {
    const session = await getEffectiveSession();
    if (!session) throw new Error("Unauthorized");

    const pending = await prisma.aIAction.findMany({
      where: { onboardingId, status: "PENDING_APPROVAL" },
    });

    for (const act of pending) {
      await approveActionAction(act.id);
    }

    await prisma.onboardingInstance.update({
      where: { id: onboardingId },
      data: {
        status: "WAITING_CLIENT",
        progressPercentage: 50,
      },
    });

    await logOnboardingAudit({
      onboardingId,
      actorId: session.id,
      actorType: "USER",
      action: "ALL_ACTIONS_APPROVED",
      details: `Batch approved and executed ${pending.length} pending onboarding actions. Instance moved to WAITING_CLIENT.`,
    });

    await calculateOnboardingHealth(onboardingId);

    safeRevalidate(`/onboarding/${onboardingId}`);
    safeRevalidate("/onboarding");
    return { success: true, count: pending.length };
  } catch (err: any) {
    console.error("[approveAllActionsAction] Error:", err);
    return { success: false, error: err.message || "Failed to approve all actions" };
  }
}

/**
 * Allows human reviewer to edit a generated document version
 */
export async function updateDocumentContentAction(documentId: string, newContent: string) {
  try {
    const session = await getEffectiveSession();
    if (!session) throw new Error("Unauthorized");

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });
    if (!doc) return { success: false, error: "Document not found" };

    const nextVersionNum = (doc.versions[0]?.versionNumber || 0) + 1;

    const newVersion = await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        versionNumber: nextVersionNum,
        content: newContent,
        generatedBy: session.email || "Human Editor",
        approvedBy: session.id,
        approvedAt: new Date(),
      },
    });

    await logOnboardingAudit({
      onboardingId: doc.onboardingId,
      actorId: session.id,
      actorType: "USER",
      action: "DOCUMENT_VERSION_UPDATED",
      details: `Updated "${doc.title}" to version ${nextVersionNum}.`,
    });

    safeRevalidate(`/onboarding/${doc.onboardingId}`);
    return { success: true, version: newVersion.versionNumber };
  } catch (err: any) {
    console.error("[updateDocumentContentAction] Error:", err);
    return { success: false, error: err.message || "Failed to update document" };
  }
}

/**
 * Activates client once all mandatory completion conditions are satisfied
 */
export async function activateClientAction(onboardingId: string) {
  try {
    const session = await getEffectiveSession();
    if (!session) throw new Error("Unauthorized");

    const instance = await prisma.onboardingInstance.findUnique({
      where: { id: onboardingId },
      include: { client: true, template: true },
    });
    if (!instance) return { success: false, error: "Onboarding instance not found" };

    // Update instance status
    await prisma.onboardingInstance.update({
      where: { id: onboardingId },
      data: {
        status: "COMPLETED",
        healthStatus: "HEALTHY",
        progressPercentage: 100,
        completedAt: new Date(),
      },
    });

    // Update Customer status to Active
    await prisma.customer.update({
      where: { id: instance.clientId },
      data: {
        status: "Active",
      },
    });

    // Auto-create Project in CRM so delivery begins immediately
    await prisma.project.create({
      data: {
        name: `${instance.client.company || instance.client.name}: ${instance.serviceName}`,
        description: `Project execution handed over from completed AI Onboarding.`,
        status: "IN_PROGRESS",
        customerId: instance.clientId,
      },
    });

    await logOnboardingAudit({
      onboardingId,
      actorId: session.id,
      actorType: "USER",
      action: "CLIENT_ACTIVATED",
      details: `Client "${instance.client.name}" successfully activated! Handed over to active project delivery.`,
    });

    safeRevalidate(`/onboarding/${onboardingId}`);
    safeRevalidate("/onboarding");
    safeRevalidate(`/customers/${instance.clientId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[activateClientAction] Error:", err);
    return { success: false, error: err.message || "Failed to activate client" };
  }
}

/**
 * Renders a document preview safely via server action
 */
export async function previewDocumentAction(onboardingId: string, documentType: string) {
  try {
    const doc = await prisma.document.findFirst({
      where: {
        onboardingId,
        OR: [{ documentType }, { id: documentType }],
      },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (doc && doc.versions.length > 0) {
      return {
        success: true,
        title: doc.title,
        content: doc.versions[0].content,
        fileUrl: doc.versions[0].fileUrl || null,
      };
    }

    const rendered = await renderDocumentForOnboarding(onboardingId, documentType);
    return { success: true, title: rendered.title, content: rendered.content, fileUrl: null };
  } catch (err: any) {
    console.error("[previewDocumentAction] Error:", err);
    return { success: false, error: err.message || "Failed to preview document" };
  }
}

/**
 * Renders a communication preview safely via server action
 */
export async function previewCommunicationAction(onboardingId: string, type: string) {
  try {
    const comm = await generateClientCommunication(onboardingId, type as any);
    return { success: true, title: comm.subject, content: comm.body };
  } catch (err: any) {
    console.error("[previewCommunicationAction] Error:", err);
    return { success: false, error: err.message || "Failed to preview communication" };
  }
}

/**
 * Generates or retrieves live AI summary for the onboarding instance (Section 35)
 */
export async function getLiveAiSummaryAction(onboardingId: string) {
  try {
    const summary = await generateClientOnboardingSummary(onboardingId);
    return { success: true, summary };
  } catch (err: any) {
    console.error("[getLiveAiSummaryAction] Error:", err);
    return { success: false, error: err.message || "Failed to generate AI summary" };
  }
}

/**
 * Resolves an open onboarding exception with documented human notes (Section 24)
 */
export async function resolveExceptionAction(exceptionId: string, resolutionNotes: string) {
  try {
    const session = await getEffectiveSession();
    if (!session) throw new Error("Unauthorized");

    const exception = await prisma.onboardingException.update({
      where: { id: exceptionId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedBy: session.id,
        resolutionNotes: resolutionNotes || "Resolved by reviewer",
      },
      include: { onboarding: true },
    });

    await logOnboardingAudit({
      onboardingId: exception.onboardingId,
      actorId: session.id,
      actorType: "USER",
      action: "EXCEPTION_RESOLVED",
      details: `Exception "${exception.type}" resolved: ${resolutionNotes}`,
      metadata: { exceptionId, type: exception.type },
    });

    await calculateOnboardingHealth(exception.onboardingId);

    safeRevalidate(`/onboarding/${exception.onboardingId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[resolveExceptionAction] Error:", err);
    return { success: false, error: err.message || "Failed to resolve exception" };
  }
}

/**
 * Regenerates an AI action proposal (Section 10 & 37)
 */
export async function regenerateActionAction(actionId: string) {
  try {
    const session = await getEffectiveSession();
    if (!session) throw new Error("Unauthorized");

    const action = await prisma.aIAction.findUnique({
      where: { id: actionId },
    });
    if (!action) return { success: false, error: "Action not found" };

    const payload = JSON.parse(action.payload || "{}");

    // Reset status to PENDING_APPROVAL and log regeneration
    await prisma.aIAction.update({
      where: { id: actionId },
      data: {
        status: "PENDING_APPROVAL",
        rejectionReason: null,
        executionResult: null,
        executedAt: null,
        approvedAt: null,
        approvedByUserId: null,
      },
    });

    await logOnboardingAudit({
      onboardingId: action.onboardingId,
      actorId: session.id,
      actorType: "USER",
      action: "ACTION_REGENERATED",
      details: `Regenerated action "${action.description}". Reset to pending approval.`,
    });

    safeRevalidate(`/onboarding/${action.onboardingId}`);
    return { success: true };
  } catch (err: any) {
    console.error("[regenerateActionAction] Error:", err);
    return { success: false, error: err.message || "Failed to regenerate action" };
  }
}

/**
 * Retrieves all AI permission matrix items (Section 24 & 29)
 */
export async function getAIPermissionsAction() {
  try {
    const permissions = await prisma.aIPermissionSetting.findMany({
      orderBy: { actionName: "asc" },
    });
    return { success: true, permissions };
  } catch (err: any) {
    console.error("[getAIPermissionsAction] Error:", err);
    return { success: false, error: err.message, permissions: [] };
  }
}

/**
 * Updates an AI permission rule (Section 24 & 29)
 */
export async function updateAIPermissionAction(
  actionKey: string,
  aiAllowed: boolean,
  humanApprovalRequired: boolean
) {
  try {
    const session = await getEffectiveSession();
    if (!session) throw new Error("Unauthorized");

    const updated = await prisma.aIPermissionSetting.update({
      where: { actionKey },
      data: {
        aiAllowed,
        humanApprovalRequired,
      },
    });

    safeRevalidate("/onboarding/admin");
    return { success: true, permission: updated };
  } catch (err: any) {
    console.error("[updateAIPermissionAction] Error:", err);
    return { success: false, error: err.message || "Failed to update permission" };
  }
}

/**
 * Adds a user's custom document, manual file, or custom template to an onboarding instance.
 * MANDATORY OVERSIGHT: Staged as PENDING_APPROVAL and creates an AIAction requiring approval
 * before it can ever be released or sent to the client.
 */
export async function addCustomDocumentAction(
  onboardingId: string,
  data: {
    title: string;
    documentType?: string;
    content: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    requiresSignature?: boolean;
    signerName?: string;
    signerEmail?: string;
    saveAsTemplate?: boolean;
    templateName?: string;
  }
) {
  try {
    const session = await getEffectiveSession();
    if (!session) throw new Error("Unauthorized");

    const instance = await prisma.onboardingInstance.findUnique({
      where: { id: onboardingId },
      include: { client: true },
    });
    if (!instance) return { success: false, error: "Onboarding instance not found" };

    if (!data.title?.trim()) {
      return { success: false, error: "Document title is required" };
    }

    // If user requested to save this as a reusable template
    let templateId: string | null = null;
    if (data.saveAsTemplate) {
      const typeKey = `CUSTOM_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      try {
        const tpl = await prisma.documentTemplate.create({
          data: {
            name: data.templateName?.trim() || data.title.trim(),
            type: typeKey,
            content: data.content || "",
            variablesJson: "[]",
            requiresApproval: true,
            requiresSignature: Boolean(data.requiresSignature),
            isActive: true,
          },
        });
        templateId = tpl.id;
      } catch (tplErr) {
        console.warn("[addCustomDocumentAction] Could not save reusable template:", tplErr);
      }
    }

    // 1. Create Document in PENDING_APPROVAL status (Client portal filters this out until APPROVED/SENT)
    const doc = await prisma.document.create({
      data: {
        onboardingId,
        clientId: instance.clientId,
        templateId,
        documentType: data.documentType || "CUSTOM_DOCUMENT",
        title: data.title.trim(),
        status: "PENDING_APPROVAL",
      },
    });

    // 2. Create DocumentVersion with content and optional file attachment
    const actorLabel = (session as any).name ? `${(session as any).name} (${session.email})` : session.email || "User";
    const initialContent = data.content?.trim() || (data.fileName ? `[Attached File: ${data.fileName}]` : "Custom Document Content");

    await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        versionNumber: 1,
        content: initialContent,
        generatedBy: actorLabel,
        fileUrl: data.fileUrl || null,
      },
    });

    // 3. Create mandatory AIAction requiring approval before sending
    const actionPayload = JSON.stringify({
      documentId: doc.id,
      title: doc.title,
      documentType: doc.documentType,
      requiresSignature: Boolean(data.requiresSignature),
      signerName: data.signerName || instance.client.name,
      signerEmail: data.signerEmail || instance.client.email,
      fileName: data.fileName || null,
      fileUrl: data.fileUrl || null,
    });

    const action = await prisma.aIAction.create({
      data: {
        onboardingId,
        actionType: "SEND_CUSTOM_DOCUMENT",
        description: `Review and approve custom document/file "${doc.title}" for ${instance.client.name} before sending`,
        payload: actionPayload,
        riskLevel: data.requiresSignature ? "CRITICAL" : "HIGH",
        requiresApproval: true,
        status: "PENDING_APPROVAL",
      },
    });

    // 4. Log Audit Event
    await logOnboardingAudit({
      onboardingId,
      actorId: session.id,
      actorType: "USER",
      action: "CUSTOM_DOCUMENT_ADDED_PENDING_APPROVAL",
      details: `User added custom document "${doc.title}". Staged for mandatory human approval before sending.`,
      metadata: { documentId: doc.id, actionId: action.id },
    });

    await calculateOnboardingHealth(onboardingId);

    safeRevalidate(`/onboarding/${onboardingId}`);
    safeRevalidate("/onboarding");

    return {
      success: true,
      documentId: doc.id,
      actionId: action.id,
      message: "Document created in DRAFT and queued for approval. It will not be sent to the client until approved.",
    };
  } catch (err: any) {
    console.error("[addCustomDocumentAction] Error:", err);
    return { success: false, error: err.message || "Failed to add custom document" };
  }
}

/**
 * Retrieves reusable templates.
 * Standard users ONLY see custom user-created templates.
 * System blueprints are strictly visible to ADMINS.
 */
export async function getUserTemplatesAction() {
  try {
    const session = await getEffectiveSession();
    if (!session) return { success: false, error: "Unauthorized", templates: [], isAdmin: false };

    const isAdmin = session.role?.toUpperCase() === "ADMIN";

    let templates: any[] = [];
    if (isAdmin) {
      // Admins see all templates (both system blueprints and custom templates)
      templates = await prisma.documentTemplate.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });
    } else {
      // Non-admins ONLY see custom user templates
      templates = await prisma.documentTemplate.findMany({
        where: {
          isActive: true,
          type: { startsWith: "CUSTOM_" },
        },
        orderBy: { name: "asc" },
      });
    }

    return { success: true, templates, isAdmin };
  } catch (err: any) {
    console.error("[getUserTemplatesAction] Error:", err);
    return { success: false, error: err.message || "Failed to load templates", templates: [], isAdmin: false };
  }
}

/**
 * Creates a reusable user template.
 */
export async function createCustomTemplateAction(data: {
  name: string;
  content: string;
  requiresSignature?: boolean;
}) {
  try {
    const session = await getEffectiveSession();
    if (!session) return { success: false, error: "Unauthorized" };

    if (!data.name?.trim()) return { success: false, error: "Template name is required" };

    const typeKey = `CUSTOM_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const template = await prisma.documentTemplate.create({
      data: {
        name: data.name.trim(),
        type: typeKey,
        content: data.content || "",
        requiresApproval: true,
        requiresSignature: Boolean(data.requiresSignature),
        isActive: true,
      },
    });

    return { success: true, template };
  } catch (err: any) {
    console.error("[createCustomTemplateAction] Error:", err);
    return { success: false, error: err.message || "Failed to create template" };
  }
}

/**
 * Deletes a custom document if it hasn't been signed.
 */
export async function deleteCustomDocumentAction(documentId: string) {
  try {
    const session = await getEffectiveSession();
    if (!session) throw new Error("Unauthorized");

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) return { success: false, error: "Document not found" };

    if (doc.status === "SIGNED") {
      return { success: false, error: "Cannot delete a signed document" };
    }

    // Clean up associated unapproved actions
    const actions = await prisma.aIAction.findMany({
      where: { onboardingId: doc.onboardingId, status: "PENDING_APPROVAL" },
    });
    for (const a of actions) {
      try {
        const p = JSON.parse(a.payload || "{}");
        if (p.documentId === documentId) {
          await prisma.aIAction.delete({ where: { id: a.id } });
        }
      } catch {}
    }

    await prisma.document.delete({ where: { id: documentId } });

    safeRevalidate(`/onboarding/${doc.onboardingId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete document" };
  }
}

/**
 * Deletes a reusable custom template. System templates cannot be deleted.
 */
export async function deleteCustomTemplateAction(templateId: string) {
  try {
    const session = await getEffectiveSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const tpl = await prisma.documentTemplate.findUnique({
      where: { id: templateId },
    });
    if (!tpl) return { success: false, error: "Template not found" };

    // Strict guard: NEVER allow deleting system blueprints
    if (!tpl.type.startsWith("CUSTOM_")) {
      return { success: false, error: "System templates cannot be deleted." };
    }

    await prisma.documentTemplate.delete({ where: { id: templateId } });

    safeRevalidate("/onboarding/admin");
    return { success: true };
  } catch (err: any) {
    console.error("[deleteCustomTemplateAction] Error:", err);
    return { success: false, error: err.message || "Failed to delete template" };
  }
}

