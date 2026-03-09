"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

export async function updateDealStage(dealId: string, stageId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await prisma.deal.update({
    where: { id: dealId, userId: session.id },
    data: { stageId }
  });

  revalidatePath("/deals");
}

export async function deleteDeal(dealId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await prisma.deal.delete({
    where: { id: dealId, userId: session.id }
  });

  revalidatePath("/deals");
}
