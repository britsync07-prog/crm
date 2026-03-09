"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { runGeneralAIChat } from "@/lib/ai-agents";

// Room Actions
export async function createRoom(formData: FormData) {
  const name = formData.get("name") as string;
  const teamId = formData.get("teamId") as string;
  const type = formData.get("type") as string;

  if (!name || !teamId) return;

  await prisma.room.create({
    data: { name, teamId, type: type || "VIDEO" },
  });

  revalidatePath("/calls");
}

export async function deleteRoom(roomId: string) {
  await prisma.room.delete({ where: { id: roomId } });
  revalidatePath("/calls");
}

// Onboarding Chat Actions
export async function startOnboardingSession(leadId: string) {
  const session = await prisma.onboardingSession.create({
    data: { leadId },
  });

  // AI Welcome Message
  await prisma.onboardingMessage.create({
    data: {
      sessionId: session.id,
      content: "Welcome! I'm your AI onboarding assistant. How can I help you get started today?",
      sender: "AI",
    },
  });

  revalidatePath("/onboarding");
  return session.id;
}

export async function sendOnboardingMessage(sessionId: string, content: string, sender: "USER" | "AI" | "CLIENT") {
  await prisma.onboardingMessage.create({
    data: { sessionId, content, sender },
  });

  if (sender === "CLIENT") {
    // Trigger AI response
    const aiResponse = await runGeneralAIChat(`Client onboarding question: ${content}`);
    await prisma.onboardingMessage.create({
      data: { sessionId, content: aiResponse, sender: "AI" },
    });
  }

  revalidatePath("/onboarding");
}
