"use client";

import { useActionState } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { createMcpTokenAction, revokeMcpTokenAction, type CreateMcpTokenState } from "@/app/settings/mcp/actions";

export type McpTokenView = {
  id: string;
  name: string;
  lastFour: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
};

type Props = {
  endpoint: string;
  tokens: McpTokenView[];
};

const initialState: CreateMcpTokenState = {};

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

export function McpTokenManager({ endpoint, tokens }: Props) {
  const [state, formAction, pending] = useActionState(createMcpTokenAction, initialState);

  return (
    <div className="space-y-5">
      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="min-w-0">
          <span className="sr-only">Token name</span>
          <input
            name="name"
            defaultValue="MCP Agent"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-900 outline-none focus:border-[#012169] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            maxLength={80}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#012169] px-4 text-sm font-black text-white disabled:opacity-60"
        >
          <KeyRound className="h-4 w-4" />
          {pending ? "Creating" : "Create Token"}
        </button>
      </form>

      {state.error ? <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{state.error}</p> : null}

      {state.token ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
          <p className="text-xs font-black uppercase tracking-widest text-green-800 dark:text-green-200">Copy this token now</p>
          <p className="mt-2 break-all font-mono text-xs text-green-950 dark:text-green-100">{state.token}</p>
          <p className="mt-4 text-xs font-black uppercase tracking-widest text-green-800 dark:text-green-200">Agent config</p>
          <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-zinc-950 p-3 text-xs leading-6 text-zinc-100">
            <code>{state.config}</code>
          </pre>
        </div>
      ) : null}

      <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Hosted Endpoint</p>
        <p className="mt-2 break-all font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">{endpoint}</p>
      </div>

      <div className="space-y-3">
        {tokens.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm font-bold text-zinc-500 dark:border-zinc-800">
            No MCP tokens yet.
          </p>
        ) : (
          tokens.map((token) => (
            <div key={token.id} className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-zinc-900 dark:text-zinc-50">{token.name}</p>
                <p className="mt-1 text-xs font-bold text-zinc-500">
                  Ends with {token.lastFour} - Last used {formatDate(token.lastUsedAt)}
                  {token.revokedAt ? ` - Revoked ${formatDate(token.revokedAt)}` : ""}
                </p>
              </div>
              {!token.revokedAt ? (
                <form action={revokeMcpTokenAction}>
                  <input type="hidden" name="tokenId" value={token.id} />
                  <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-black text-red-700 dark:border-red-900 dark:text-red-300">
                    <Trash2 className="h-4 w-4" />
                    Revoke
                  </button>
                </form>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
