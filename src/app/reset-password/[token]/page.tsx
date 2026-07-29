"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Key, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff, AlertTriangle } from "lucide-react";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [tokenState, setTokenState] = useState<"loading" | "valid" | "invalid">("loading");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch(`/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setTokenState(d.valid ? "valid" : "invalid"))
      .catch(() => setTokenState("invalid"));
  }, [token]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => router.push("/login"), 3000);
    return () => clearTimeout(t);
  }, [success, router]);

  if (tokenState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0f0f10] p-4">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (tokenState === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0f0f10] p-4">
        <div className="bg-white dark:bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 w-full max-w-md text-center shadow-2xl space-y-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-[#c8102e]" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">Invalid Link</h1>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
              This password reset link is invalid or has expired. Reset links are only valid for <strong>1 hour</strong>.
            </p>
          </div>
          <Link href="/forgot-password" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#c8102e] hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong");
      else setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0f0f10] p-4">
        <div className="bg-white dark:bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 w-full max-w-md text-center shadow-2xl space-y-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">Password Reset</h1>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">Your password has been updated. Redirecting to login...</p>
          </div>
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#012169] hover:underline">
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
            <Key className="w-8 h-8 text-[#012169]" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">New Password</h1>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              required
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169] pr-11"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169]"
          />

          {error && <p className="text-xs font-bold text-[#c8102e] text-center">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[#012169] text-white font-bold text-sm hover:bg-[#012169]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
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
