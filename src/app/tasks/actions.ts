"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

export async function createAdvancedTask(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string;
  const status = formData.get("status") as string || "Todo";
  
  if (!title) return;

  await (prisma.task as any).create({
    data: {
      title,
      description,
      priority,
      status,
      assigneeId: session.id,
    }
  });

  revalidatePath("/tasks");
}

export async function updateTaskStatus(taskId: string, newStatus: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus }
  });

  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await prisma.task.delete({
    where: { id: taskId }
  });

  revalidatePath("/tasks");
}
