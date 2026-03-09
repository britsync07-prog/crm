"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export async function createAutomationFlow(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const triggerType = formData.get("triggerType") as string;
  const stepType = formData.get("stepType") as string;
  const actionType = formData.get("actionType") as string;

  await prisma.automation.create({
    data: {
      userId: session.id,
      name,
      triggerType,
      isActive: true,
      steps: {
        create: [
          {
            type: stepType,
            order: 1,
            config: JSON.stringify({
              actionType,
              data: {
                title: "Automated Task",
                description: "Created via workflow",
                template: "welcome_email"
              }
            }),
          }
        ]
      }
    },
  });

  revalidatePath("/automations");
  redirect("/automations");
}
