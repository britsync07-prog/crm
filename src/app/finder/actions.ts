"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCategoriesAction() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.category.findMany({
    where: { userId: session.id },
    orderBy: { name: "asc" },
  });
}

export async function createCategoryAction(name: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const category = await prisma.category.create({
    data: { name, userId: session.id },
  });

  revalidatePath("/leads");
  return category;
}

export async function deleteCategoryAction(categoryId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await prisma.category.update({
    where: { id: categoryId, userId: session.id },
    data: { leads: { set: [] } },
  });

  await prisma.category.delete({
    where: { id: categoryId, userId: session.id },
  });

  revalidatePath("/leads");
}

export async function bulkUpdateLeadStatusAction(leadIds: string[], status: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const result = await prisma.lead.updateMany({
    where: { id: { in: leadIds }, userId: session.id },
    data: { status },
  });

  revalidatePath("/leads");
  return { updated: result.count };
}

export async function deleteLeadsAction(leadIds: string[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds }, userId: session.id },
    select: { id: true },
  });
  const ownedLeadIds = leads.map((lead) => lead.id);

  if (ownedLeadIds.length === 0) return { deleted: 0 };

  const result = await prisma.$transaction(async (tx) => {
    await tx.campaignLead.deleteMany({ where: { leadId: { in: ownedLeadIds } } });
    await tx.deal.updateMany({ where: { leadId: { in: ownedLeadIds }, userId: session.id }, data: { leadId: null } });
    await tx.task.updateMany({ where: { leadId: { in: ownedLeadIds } }, data: { leadId: null } });
    await tx.booking.updateMany({ where: { leadId: { in: ownedLeadIds } }, data: { leadId: null } });
    await tx.interaction.updateMany({ where: { leadId: { in: ownedLeadIds } }, data: { leadId: null } });

    return tx.lead.deleteMany({
      where: { id: { in: ownedLeadIds }, userId: session.id },
    });
  });

  revalidatePath("/leads");
  return { deleted: result.count };
}
