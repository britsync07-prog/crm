import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateOnboardingHealth } from "@/lib/onboarding/ai-engine";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const instance = await prisma.onboardingInstance.findUnique({
      where: { id },
      include: {
        documents: true,
        signatureRequests: true,
        responses: true,
        exceptions: { where: { status: "OPEN" } },
      },
    });

    if (!instance) {
      return NextResponse.json({ success: false, error: "Instance not found" }, { status: 404 });
    }

    const health = await calculateOnboardingHealth(id);

    const completionCriteria = {
      requiredDocuments: instance.documents.length > 0 && instance.documents.every((d) => d.status === "APPROVED" || d.status === "SIGNED"),
      requiredSignatures: instance.signatureRequests.length > 0 && instance.signatureRequests.every((s) => s.status === "SIGNED"),
      requiredInformation: instance.responses.length > 0,
      payment: instance.invoiceStatus === "PAID",
      compliance: true,
      internalTasks: true,
      projectSetup: instance.status === "COMPLETED" || instance.status === "READY_FOR_ACTIVATION",
    };

    return NextResponse.json({
      success: true,
      onboardingId: id,
      status: instance.status,
      healthStatus: health.healthStatus,
      healthReason: health.healthReason,
      progressPercentage: health.progressPercentage,
      recommendedNextAction: health.recommendedNextAction,
      exceptions: instance.exceptions,
      completionCriteria,
      readyForActivation: Object.values(completionCriteria).every(Boolean) || instance.status === "READY_FOR_ACTIVATION",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
