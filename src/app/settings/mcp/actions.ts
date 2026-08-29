"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/app-url";
import { prisma } from "@/lib/db";
import { createMcpAccessToken, revokeMcpAccessToken } from "@/lib/mcp-tokens";
import { createOAuthClient, revokeOAuthClient, listOAuthClients } from "@/lib/oauth-store";

export type CreateMcpTokenState = {
  error?: string;
  token?: string;
  endpoint?: string;
  config?: string;
};

export type CreateOAuthClientState = {
  error?: string;
  clientId?: string;
  clientSecret?: string;
  name?: string;
  endpoint?: string;
  authorizeUrl?: string;
  tokenUrl?: string;
};

async function requireActiveUser() {
  const session = await getSession();
  if (!session?.id) throw new Error("You must be signed in to manage MCP tokens & OAuth apps.");

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

export async function createOAuthClientAction(
  _state: CreateOAuthClientState,
  formData: FormData,
): Promise<CreateOAuthClientState> {
  let user: { id: string };
  try {
    user = await requireActiveUser();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create OAuth client." };
  }

  const name = String(formData.get("name") || "Gemini Spark Connected App").trim();
  const rawRedirects = String(formData.get("redirectUris") || "").trim();
  const redirectUris = rawRedirects
    ? rawRedirects.split("\n").map((s) => s.trim()).filter(Boolean)
    : [
        "https://gemini.google.com/oauth/callback",
        "https://gemini.google.com",
        "http://localhost:3000/oauth/callback",
      ];

  try {
    const client = await createOAuthClient({
      userId: user.id,
      name,
      redirectUris,
      isConfidential: true,
    });

    const baseUrl = getAppBaseUrl();
    revalidatePath("/settings/mcp");

    return {
      clientId: client.clientId,
      clientSecret: client.clientSecret,
      name: client.name,
      endpoint: `${baseUrl}/api/mcp`,
      authorizeUrl: `${baseUrl}/oauth/authorize`,
      tokenUrl: `${baseUrl}/api/oauth/token`,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create OAuth client." };
  }
}

export async function revokeOAuthClientAction(formData: FormData) {
  let user: { id: string };
  try {
    user = await requireActiveUser();
  } catch {
    return;
  }

  const clientId = String(formData.get("clientId") || "");
  if (!clientId) return;

  await revokeOAuthClient(user.id, clientId);
  revalidatePath("/settings/mcp");
}
