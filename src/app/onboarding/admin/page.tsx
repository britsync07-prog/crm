import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listServiceTemplates } from "@/lib/onboarding/service-templates";
import { ensureDocumentTemplates } from "@/lib/onboarding/document-templates";
import { ensureOnboardingDatabaseSchema } from "@/lib/onboarding/db-init";
import TemplateStudioClient from "@/components/onboarding/TemplateStudioClient";

export const dynamic = "force-dynamic";

export default async function OnboardingAdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Ensure DB tables exist
  await ensureOnboardingDatabaseSchema();

  const isAdmin = session.role?.toUpperCase() === "ADMIN";

  let systemServiceTemplates: any[] = [];
  let systemDocTemplates: any[] = [];
  let permissions: any[] = [];
  let customTemplates: any[] = [];

  // 1. If ADMIN: Load system blueprints, approved system docs, and AI permissions
  if (isAdmin) {
    try {
      await ensureDocumentTemplates();
      systemServiceTemplates = await listServiceTemplates();
    } catch (err) {
      console.error("[OnboardingAdminPage] Error loading service templates:", err);
    }

    try {
      systemDocTemplates = await prisma.documentTemplate.findMany({
        where: {
          isActive: true,
          type: { not: { startsWith: "CUSTOM_" } },
        },
        orderBy: { type: "asc" },
      });
    } catch (err) {
      console.error("[OnboardingAdminPage] Error loading system doc templates:", err);
    }

    try {
      permissions = await prisma.aIPermissionSetting.findMany({
        orderBy: { actionName: "asc" },
      });
    } catch (err) {
      console.error("[OnboardingAdminPage] Error loading AI permissions:", err);
    }
  }

  // 2. Load reusable custom templates for this user/org
  try {
    customTemplates = await prisma.documentTemplate.findMany({
      where: {
        isActive: true,
        type: { startsWith: "CUSTOM_" },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("[OnboardingAdminPage] Error loading custom templates:", err);
  }

  return (
    <TemplateStudioClient
      isAdmin={isAdmin}
      systemServiceTemplates={systemServiceTemplates}
      systemDocTemplates={systemDocTemplates}
      permissions={permissions}
      initialCustomTemplates={customTemplates}
    />
  );
}
