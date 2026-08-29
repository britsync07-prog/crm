"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getOAuthClientByClientId,
  createOAuthAuthCode,
} from "@/lib/oauth-store";

export type AuthorizeState = {
  error?: string;
};

export async function approveOAuthAction(_prevState: AuthorizeState, formData: FormData) {
  const session = await getSession();
  if (!session?.id) {
    return { error: "You must be signed in to authorize this application." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, status: true },
  });

  if (!user || user.status !== "ACTIVE") {
    return { error: "Your CRM user account is not active." };
  }

  const clientId = String(formData.get("client_id") || "").trim();
  const redirectUri = String(formData.get("redirect_uri") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const codeChallenge = String(formData.get("code_challenge") || "").trim() || null;
  const codeChallengeMethod = String(formData.get("code_challenge_method") || "S256").trim();
  const scope = String(formData.get("scope") || "mcp").trim();

  if (!clientId || !redirectUri) {
    return { error: "Missing required client_id or redirect_uri parameters." };
  }

  const client = await getOAuthClientByClientId(clientId);
  if (!client) {
    return { error: `Invalid or unrecognized OAuth client (${clientId}).` };
  }

  let code: string;
  try {
    code = await createOAuthAuthCode({
      clientId,
      userId: user.id,
      redirectUri,
      codeChallenge,
      codeChallengeMethod,
      scope,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to generate authorization code." };
  }

  // Construct redirect URL
  const callback = new URL(redirectUri);
  callback.searchParams.set("code", code);
  if (state) {
    callback.searchParams.set("state", state);
  }

  redirect(callback.toString());
}

export async function denyOAuthAction(formData: FormData) {
  const redirectUri = String(formData.get("redirect_uri") || "").trim();
  const state = String(formData.get("state") || "").trim();

  if (!redirectUri) {
    redirect("/settings/mcp");
  }

  try {
    const callback = new URL(redirectUri);
    callback.searchParams.set("error", "access_denied");
    callback.searchParams.set("error_description", "The user denied the authorization request.");
    if (state) {
      callback.searchParams.set("state", state);
    }
    redirect(callback.toString());
  } catch {
    redirect("/settings/mcp");
  }
}
