"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const sig = searchParams.get("sig");
  const [status, setStatus] = useState<"loading" | "unsubscribed" | "subscribed" | "error">(uid ? "loading" : "error");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleUnsubscribe() {
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, sig }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); setStatus("error"); return; }
      setEmail(data.email || "");
      setStatus("unsubscribed");
    } catch {
      setError("Network error");
      setStatus("error");
    }
  }

  async function handleResubscribe() {
    if (!email) return;
    try {
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus("subscribed");
    } catch {
      setError("Network error");
    }
  }

  if (status === "loading") {
    handleUnsubscribe();
  }

  if (status === "unsubscribed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0f0f10] p-4">
        <div className="bg-white dark:bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 w-full max-w-md text-center shadow-2xl space-y-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">Unsubscribed</h1>
          {email && <p className="text-sm text-zinc-500"><strong className="text-zinc-700">{email}</strong> has been unsubscribed from newsletters.</p>}
          <button onClick={handleResubscribe} className="px-6 py-3 rounded-xl bg-[#012169] text-white font-bold text-sm hover:bg-[#012169]/90 transition-all">
            Resubscribe
          </button>
          <Link href="/login" className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#012169]">Back to Login</Link>
        </div>
      </div>
    );
  }

  if (status === "subscribed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0f0f10] p-4">
        <div className="bg-white dark:bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 w-full max-w-md text-center shadow-2xl space-y-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">Subscribed</h1>
          <p className="text-sm text-zinc-500">You&apos;re back on the list.</p>
          <Link href="/login" className="inline-flex text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#012169]">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0f0f10] p-4">
      <div className="bg-white dark:bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 w-full max-w-md text-center shadow-2xl space-y-8">
        <div className="w-16 h-16 rounded-[1.5rem] bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-[#c8102e]" />
        </div>
        <h1 className="text-3xl font-black italic tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">Invalid Link</h1>
        <p className="text-sm text-zinc-500">{error || "This unsubscribe link is invalid or expired."}</p>
        <Link href="/login" className="inline-flex text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#012169]">Back to Login</Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#012169]" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
