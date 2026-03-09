"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createBooking(formData: FormData) {
  const title = formData.get("title") as string;
  const startTime = formData.get("startTime") as string;
  const leadId = formData.get("leadId") as string;

  await prisma.booking.create({
    data: {
      title,
      startTime: new Date(startTime),
      endTime: new Date(new Date(startTime).getTime() + 30 * 60 * 1000), // 30 min duration
      leadId: leadId || null,
    },
  });

  revalidatePath("/calls");
}
