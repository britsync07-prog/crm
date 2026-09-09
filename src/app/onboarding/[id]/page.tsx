import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import OnboardingCommandCenter from "@/components/onboarding/OnboardingCommandCenter";
import {
  getInternalQuestions,
  generateClientOnboardingSummary,
} from "@/lib/onboarding/ai-engine";

export const dynamic = "force-dynamic";

export default async function OnboardingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const instance = await prisma.onboardingInstance.findUnique({
    where: { id },
    include: {
      client: true,
      deal: true,
      template: true,
      owner: { select: { id: true, name: true, email: true } },
      actions: { orderBy: { createdAt: "asc" } },
      documents: {
        include: { versions: { orderBy: { versionNumber: "desc" } } },
      },
      signatureRequests: {
        include: { signatories: true },
      },
      responses: { orderBy: { submittedAt: "desc" } },
      exceptions: { orderBy: { detectedAt: "desc" } },
    },
  });

  if (!instance) {
    notFound();
  }

  const internalQuestions = await getInternalQuestions(instance.id);
  const auditEvents = await prisma.onboardingAuditEvent.findMany({
    where: { onboardingId: instance.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const aiSummary = await generateClientOnboardingSummary(instance.id);

  return (
    <OnboardingCommandCenter
      instance={instance}
      internalQuestions={internalQuestions}
      auditEvents={auditEvents}
      aiSummary={aiSummary}
    />
  );
}
