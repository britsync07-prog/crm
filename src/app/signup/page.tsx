"use client";

import { signupAction } from "@/app/auth-actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, User, UserPlus, Tag } from "lucide-react";
import { useActionState, Suspense, useState, useEffect } from "react";

const initialState = { error: null };

function SignupForm() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") ?? "";
  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  const queryRef =
    searchParams.get("ref") ||
    searchParams.get("referral") ||
    searchParams.get("agency") ||
    "";

  const [refCode, setRefCode] = useState(queryRef);
  const [state, formAction] = useActionState(signupAction as any, initialState);

  // If no referral query param is present, inspect client cookie to pre-fill
  useEffect(() => {
    if (!queryRef && typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)britcrm_ref=([^;]+)/);
      if (match && match[1]) {
        try {
          setRefCode(decodeURIComponent(match[1]));
        } catch {
          setRefCode(match[1]);
        }
      }
    }
  }, [queryRef]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(1,33,105,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(200,16,46,0.14),transparent_42%),#f7f9ff] dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 bg-white/95 dark:bg-slate-950 p-8 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[#012169] to-[#c8102e] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {inviteToken ? "Accept Invitation" : "Create your BritCRM account"}
          </h1>
          <p className="text-zinc-500 text-sm">
            {inviteToken ? "Join your team on BritCRM" : "Start your BritSync workspace trial"}
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-lg text-center font-medium">
              {state.error}
            </div>
          )}

          {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}
          {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/20 focus:outline-none focus:ring-2 focus:ring-[#012169] transition-all text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/20 focus:outline-none focus:ring-2 focus:ring-[#012169] transition-all text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/20 focus:outline-none focus:ring-2 focus:ring-[#012169] transition-all text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/20 focus:outline-none focus:ring-2 focus:ring-[#012169] transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Optional Referral Code Input */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Referral Code
                </label>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  Optional
                </span>
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  name="ref"
                  type="text"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  placeholder="e.g. AGENT10 or partner-slug"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/20 focus:outline-none focus:ring-2 focus:ring-[#012169] transition-all text-sm font-mono placeholder:font-sans"
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                Have an agency or partner referral code? Enter it here (optional).
              </p>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 leading-relaxed">
            By signing up, you agree to our <Link href="/terms" className="text-[#012169] underline">Terms of Service</Link> and <Link href="/privacy" className="text-[#012169] underline">Privacy Policy</Link>.
          </div>

          <button
            type="submit"
            className="w-full bg-[#012169] text-white py-3 rounded-lg font-bold hover:bg-[#c8102e] transition-colors shadow-lg flex items-center justify-center text-sm gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {inviteToken ? "Accept & Create Account" : "Create My Account"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href={`/login${
            callbackUrl 
              ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` 
              : inviteToken 
                ? `?invite=${inviteToken}` 
                : ""
          }`} className="text-[#012169] font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-bold">
        Loading...
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
