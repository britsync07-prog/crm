import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOAuthClientByClientId } from "@/lib/oauth-store";
import { OAuthConsentForm } from "@/components/OAuthConsentForm";
import { Bot, ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    client_id?: string;
    redirect_uri?: string;
    response_type?: string;
    state?: string;
    code_challenge?: string;
    code_challenge_method?: string;
    scope?: string;
  }>;
};

export default async function OAuthAuthorizePage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await getSession();

  const clientId = params.client_id || "";
  const redirectUri = params.redirect_uri || "";
  const responseType = params.response_type || "code";
  const state = params.state || "";
  const codeChallenge = params.code_challenge || "";
  const codeChallengeMethod = params.code_challenge_method || "S256";
  const scope = params.scope || "mcp";

  // Build current URL for callbackUrl if not logged in
  const queryStr = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: responseType,
    ...(state ? { state } : {}),
    ...(codeChallenge ? { code_challenge: codeChallenge } : {}),
    ...(codeChallengeMethod ? { code_challenge_method: codeChallengeMethod } : {}),
    ...(scope ? { scope } : {}),
  }).toString();

  const currentPath = `/oauth/authorize?${queryStr}`;

  if (!session?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  if (!user || user.status !== "ACTIVE") {
    redirect(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
  }

  if (!clientId || !redirectUri) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(1,33,105,0.12),transparent_40%),#f7f9ff] dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-red-200 dark:border-red-900/30 shadow-xl space-y-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Invalid Authorization Request</h1>
          <p className="text-sm text-zinc-500">
            Missing required parameters (<code>client_id</code> or <code>redirect_uri</code>).
          </p>
          <Link href="/settings/mcp" className="inline-block mt-4 text-sm font-bold text-[#012169] dark:text-blue-400 hover:underline">
            Back to MCP Settings
          </Link>
        </div>
      </div>
    );
  }

  const client = await getOAuthClientByClientId(clientId);
  if (!client) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(1,33,105,0.12),transparent_40%),#f7f9ff] dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-red-200 dark:border-red-900/30 shadow-xl space-y-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Unrecognized OAuth Client</h1>
          <p className="text-sm text-zinc-500">
            The client ID <code className="break-all font-mono text-xs">{clientId}</code> is invalid or has been revoked.
          </p>
          <Link href="/settings/mcp" className="inline-block mt-4 text-sm font-bold text-[#012169] dark:text-blue-400 hover:underline">
            Manage Connected Apps
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(1,33,105,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(200,16,46,0.12),transparent_40%),#f7f9ff] dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-[#012169] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Bot className="w-6 h-6" />
            </div>
            <div className="h-0.5 w-6 bg-zinc-300 dark:bg-zinc-700" />
            <div className="w-12 h-12 bg-gradient-to-br from-[#012169] to-[#c8102e] text-white rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-lg font-black">B</span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Connect to BritCRM</h1>
          <p className="text-sm font-medium text-zinc-500">
            <span className="font-bold text-zinc-900 dark:text-zinc-200">{client.name}</span> wants to connect to your BritCRM account.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-500 uppercase tracking-wider">Signed in as</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-200">{user.email}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-500 uppercase tracking-wider">CRM Role</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-200">{user.role}</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Permissions Requested</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">Model Context Protocol (MCP) CRM Access</p>
                <p className="text-xs text-zinc-500">Read & execute approved CRM tools (Leads, Outreach, Mail, Forms, Calendar, Billing) as your user.</p>
              </div>
            </div>
          </div>
        </div>

        <OAuthConsentForm
          clientId={clientId}
          redirectUri={redirectUri}
          state={state}
          codeChallenge={codeChallenge}
          codeChallengeMethod={codeChallengeMethod}
          scope={scope}
          clientName={client.name}
        />
      </div>
    </div>
  );
}
