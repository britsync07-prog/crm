"use client";

import { useState, useActionState } from "react";
import {
  KeyRound,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Plus,
  Radio,
  Layers,
} from "lucide-react";
import {
  createOAuthClientAction,
  revokeOAuthClientAction,
  type CreateOAuthClientState,
} from "@/app/settings/mcp/actions";

export type OAuthClientView = {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
  activeTokenCount: number;
};

type Props = {
  endpoint: string;
  clients: OAuthClientView[];
};

const initialState: CreateOAuthClientState = {};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function OAuthClientManager({ endpoint, clients }: Props) {
  const [state, formAction, pending] = useActionState(createOAuthClientAction, initialState);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      // Fallback
    }
  };

  const toggleSecret = (id: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Quick Generator Box */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-6 dark:border-blue-900/40 dark:from-blue-950/20 dark:via-zinc-950 dark:to-indigo-950/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#012169] text-white shadow-md shadow-blue-900/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-zinc-50">
                Generate Standard OAuth Credentials
              </h3>
              <p className="text-xs font-medium text-zinc-500">
                Create a dedicated Client ID & Secret for Gemini Spark or external OAuth 2.0 MCP clients.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvancedForm(!showAdvancedForm)}
            className="text-xs font-bold text-[#012169] hover:underline dark:text-blue-400 self-start sm:self-auto"
          >
            {showAdvancedForm ? "Hide Options" : "Custom Settings"}
          </button>
        </div>

        <form action={formAction} className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">
                Client Name / Description
              </label>
              <input
                name="name"
                defaultValue="Gemini Spark Connected App"
                placeholder="e.g. Gemini Spark, Claude OAuth"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-900 outline-none focus:border-[#012169] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                maxLength={80}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#012169] hover:bg-[#00174d] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/20 disabled:opacity-60 transition-all"
              >
                <Plus className="h-4 w-4" />
                {pending ? "Generating..." : "Generate OAuth Credentials"}
              </button>
            </div>
          </div>

          {showAdvancedForm && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                Allowed Redirect URIs (one per line)
                <span className="block text-[11px] font-normal text-zinc-400 mt-0.5">
                  Defaults to Google Gemini & localhost callback URLs
                </span>
              </label>
              <textarea
                name="redirectUris"
                defaultValue="https://gemini.google.com/oauth/callback&#10;https://gemini.google.com"
                rows={3}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-xs text-zinc-900 outline-none focus:border-[#012169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          )}
        </form>

        {state.error ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">
            {state.error}
          </p>
        ) : null}

        {/* Newly Created Credentials Display */}
        {state.clientId && state.clientSecret ? (
          <div className="mt-6 rounded-2xl border border-green-300 bg-green-50/80 p-5 dark:border-green-800 dark:bg-green-950/30 space-y-4">
            <div className="flex items-center gap-2 text-green-900 dark:text-green-200">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <p className="text-sm font-black uppercase tracking-wider">
                OAuth Credentials Created Successfully!
              </p>
            </div>
            <p className="text-xs text-green-800 dark:text-green-300">
              Copy and paste these into Google Gemini Spark under <strong>Connected Apps &gt; Add custom app &gt; Show more</strong>:
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-green-200 bg-white p-3.5 dark:border-green-900/50 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    OAuth Client ID
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(state.clientId || "", "new_client_id")}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#012169] hover:underline dark:text-blue-300"
                  >
                    {copiedKey === "new_client_id" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy ID
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-1.5 break-all font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {state.clientId}
                </p>
              </div>

              <div className="rounded-xl border border-green-200 bg-white p-3.5 dark:border-green-900/50 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    OAuth Client Secret
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(state.clientSecret || "", "new_client_secret")}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#012169] hover:underline dark:text-blue-300"
                  >
                    {copiedKey === "new_client_secret" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy Secret
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-1.5 break-all font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {state.clientSecret}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-green-200 bg-white p-3.5 dark:border-green-900/50 dark:bg-zinc-950">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  MCP Server URL for Gemini
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(state.endpoint || endpoint, "new_endpoint")}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#012169] hover:underline dark:text-blue-300"
                >
                  {copiedKey === "new_endpoint" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy URL
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1.5 break-all font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {state.endpoint || endpoint}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Gemini Spark Setup Instructions Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-[#012169] dark:text-blue-300 font-black text-xs">
            G
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50">
              How to Connect to Google Gemini Spark
            </h4>
            <p className="text-xs text-zinc-500">
              Follow these simple steps in the Gemini web app (gemini.google.com)
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#012169] text-white text-[11px] font-black">
              1
            </span>
            <p className="mt-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">Open Connected Apps</p>
            <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">
              In Gemini, go to <strong>Settings & help &gt; Connected Apps</strong> (or Personal Intelligence).
            </p>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#012169] text-white text-[11px] font-black">
              2
            </span>
            <p className="mt-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">Add Custom App URL</p>
            <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">
              Under Custom Apps for Spark, enter:
              <br />
              <code className="break-all font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">{endpoint}</code>
            </p>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#012169] text-white text-[11px] font-black">
              3
            </span>
            <p className="mt-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">Enter Credentials</p>
            <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">
              Click <strong>Show more</strong> and paste the <strong>Client ID</strong> and <strong>Client secret</strong> generated above.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#012169] text-white text-[11px] font-black">
              4
            </span>
            <p className="mt-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">Authorize & Use</p>
            <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">
              Click <strong>Next</strong>, authorize the connection, then tag <code>@BritCRM</code> in your Gemini conversations!
            </p>
          </div>
        </div>
      </div>

      {/* Existing OAuth Clients List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Registered OAuth Clients ({clients.length})
          </p>
        </div>

        {clients.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-5 text-center text-sm font-bold text-zinc-500 dark:border-zinc-800">
            No OAuth clients registered yet. Click &quot;Generate OAuth Credentials&quot; above to create one.
          </p>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => {
              const isRevealed = revealedSecrets[client.id] || false;
              const isRevoked = Boolean(client.revokedAt);

              return (
                <div
                  key={client.id}
                  className={`rounded-2xl border p-5 transition-all ${
                    isRevoked
                      ? "border-zinc-200 bg-zinc-50/50 opacity-60 dark:border-zinc-800 dark:bg-zinc-950/40"
                      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-base font-black text-zinc-900 dark:text-zinc-50">
                          {client.name}
                        </h4>
                        {isRevoked ? (
                          <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase text-red-700 dark:bg-red-950 dark:text-red-300">
                            Revoked
                          </span>
                        ) : (
                          <span className="rounded-md bg-green-100 px-2 py-0.5 text-[10px] font-black uppercase text-green-700 dark:bg-green-950 dark:text-green-300">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                            OAuth Client ID
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="truncate font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                              {client.clientId}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(client.clientId, `id_${client.id}`)}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
                              title="Copy Client ID"
                            >
                              {copiedKey === `id_${client.id}` ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                            OAuth Client Secret
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                              {isRevealed
                                ? client.clientSecret
                                : "•".repeat(Math.min(client.clientSecret.length || 24, 24))}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleSecret(client.id)}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
                              title={isRevealed ? "Hide secret" : "Show secret"}
                            >
                              {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(client.clientSecret, `sec_${client.id}`)}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
                              title="Copy Secret"
                            >
                              {copiedKey === `sec_${client.id}` ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] font-medium text-zinc-400 pt-1">
                        Created {formatDate(client.createdAt)} • {client.activeTokenCount} active token
                        {client.activeTokenCount === 1 ? "" : "s"}
                        {client.revokedAt ? ` • Revoked on ${formatDate(client.revokedAt)}` : ""}
                      </p>
                    </div>

                    {!isRevoked && (
                      <form action={revokeOAuthClientAction} className="shrink-0 pt-2 lg:pt-0">
                        <input type="hidden" name="clientId" value={client.clientId} />
                        <button
                          type="submit"
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 text-xs font-black text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Revoke Client
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
