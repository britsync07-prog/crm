"use client";

import { loginAction } from "@/app/auth-actions";
import Link from "next/link";
import { Mail, Lock, LogIn } from "lucide-react";
import { useActionState } from "react";

const initialState = { error: null };

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction as any, initialState);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-950 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-zinc-900 dark:bg-zinc-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white dark:text-black font-bold text-xl">M</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-zinc-500 text-sm">Enter your credentials to access your dashboard</p>
        </div>

        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-lg text-center font-medium">
              {state.error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Password</label>
                <Link href="/forgot-password" title="Coming soon" className="text-[10px] font-bold text-blue-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="remember" className="rounded border-zinc-300" />
            <label htmlFor="remember" className="text-xs text-zinc-500 font-medium cursor-pointer">Remember me for 30 days</label>
          </div>

          <button
            type="submit"
            className="w-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-black py-3 rounded-lg font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-lg flex items-center justify-center text-sm gap-2"
          >
            <LogIn className="w-4 h-4" />
            Login to Dashboard
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-600 font-bold hover:underline">Sign up for free</Link>
        </p>
      </div>
    </div>
  );
}
