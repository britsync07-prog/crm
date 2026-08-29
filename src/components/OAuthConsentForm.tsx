"use client";

import { useActionState } from "react";
import { approveOAuthAction, denyOAuthAction, type AuthorizeState } from "@/app/oauth/authorize/actions";
import { Check, X, ShieldCheck } from "lucide-react";

type Props = {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  clientName: string;
};

const initialState: AuthorizeState = {};

export function OAuthConsentForm({
  clientId,
  redirectUri,
  state,
  codeChallenge,
  codeChallengeMethod,
  scope,
  clientName,
}: Props) {
  const [approveState, approveAction, approvePending] = useActionState(approveOAuthAction, initialState);

  return (
    <div className="space-y-4">
      {approveState?.error ? (
        <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {approveState.error}
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <form action={denyOAuthAction} className="flex-1">
          <input type="hidden" name="redirect_uri" value={redirectUri} />
          <input type="hidden" name="state" value={state} />
          <button
            type="submit"
            className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-all"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </form>

        <form action={approveAction} className="flex-1">
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="redirect_uri" value={redirectUri} />
          <input type="hidden" name="state" value={state} />
          <input type="hidden" name="code_challenge" value={codeChallenge} />
          <input type="hidden" name="code_challenge_method" value={codeChallengeMethod} />
          <input type="hidden" name="scope" value={scope} />
          <button
            type="submit"
            disabled={approvePending}
            className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#012169] hover:bg-[#00174d] px-4 text-sm font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-60 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            {approvePending ? "Connecting..." : `Authorize & Connect`}
          </button>
        </form>
      </div>

      <p className="text-center text-[11px] text-zinc-400">
        By authorizing, you allow {clientName} to securely interact with your BritCRM tools and data.
      </p>
    </div>
  );
}
