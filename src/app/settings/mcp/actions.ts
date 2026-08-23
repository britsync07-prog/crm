"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/app-url";
import { prisma } from "@/lib/db";
import { createMcpAccessToken, revokeMcpAccessToken } from "@/lib/mcp-tokens";

export type CreateMcpTokenState = {
  error?: string;
  token?: string;
  endpoint?: string;
  config?: string;
};

async function requireActiveUser() {
  const session = await getSession();
  if (!session?.id) throw new Error("You must be signed in to manage MCP tokens.");

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") throw new Error("Your account is not active.");
  return user;
}

export async function createMcpTokenAction(_state: CreateMcpTokenState, formData: FormData): Promise<CreateMcpTokenState> {
  let user: { id: string };
  try {
    user = await requireActiveUser();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create MCP token." };
  }

  const name = String(formData.get("name") || "MCP Agent");
  const { token } = await createMcpAccessToken(user.id, name);
  const endpoint = `${getAppBaseUrl()}/api/mcp`;
  const config = JSON.stringify(
    {
      mcpServers: {
        britcrm: {
          url: endpoint,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    },
    null,
    2,
  );

  revalidatePath("/settings/mcp");
  return { token, endpoint, config };
}

export async function revokeMcpTokenAction(formData: FormData) {
  let user: { id: string };
  try {
    user = await requireActiveUser();
  } catch {
    return;
  }

  const tokenId = String(formData.get("tokenId") || "");
  if (!tokenId) return;

  await revokeMcpAccessToken(user.id, tokenId);
  revalidatePath("/settings/mcp");
}
