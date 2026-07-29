"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong");
      else setSent(true);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0f0f10] p-4">
        <div className="bg-white dark:bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 w-full max-w-md text-center shadow-2xl space-y-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">Check Your Email</h1>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
              If an account with <strong className="text-zinc-700">{email}</strong> exists, we've sent a password reset link.
            </p>
          </div>
          <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#012169] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0f0f10] p-4">
      <div className="bg-white dark:bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-[1.5rem] bg-[#012169]/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-[#012169]" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">Forgot Password</h1>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-[#c8102e] text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#012169] text-white font-bold text-sm hover:bg-[#012169]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
          </button>
        </form>

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#012169] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
