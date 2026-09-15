"use client";

import { useRouter } from "next/navigation";
import { deleteEmailAccount, deleteAllEmailAccounts, resetEmailAccountCounter } from "@/app/campaign-actions";
import { Trash2, AlertTriangle, RotateCcw } from "lucide-react";
import { useState } from "react";

export function DeleteAccountButton({ accountId, email }: { accountId: string; email: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteEmailAccount(accountId);
    if (result.error) {
      alert(result.error);
    }
    setLoading(false);
    setConfirming(false);
    router.refresh();
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Remove?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
        >
          {loading ? "..." : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-all"
      title={`Remove ${email}`}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

export function RemoveAllButton({ hasAccounts }: { hasAccounts: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRemoveAll = async () => {
    setLoading(true);
    const result = await deleteAllEmailAccounts();
    if (result.error) {
      alert(result.error);
    }
    setLoading(false);
    setConfirming(false);
    router.refresh();
  };

  if (!hasAccounts) return null;

  if (confirming) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">
          Remove all gateways?
        </span>
        <button
          onClick={handleRemoveAll}
          disabled={loading}
          className="px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all"
        >
          {loading ? "..." : "Yes, Remove All"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-3 rounded-xl transition-all flex items-center gap-2"
    >
      <Trash2 className="w-3.5 h-3.5" /> Remove All Gateways
    </button>
  );
}

export function ResetCounterButton({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Reset the 'Sent Today' counter back to 0 for this mailbox?")) {
      return;
    }
    setLoading(true);
    const result = await resetEmailAccountCounter(accountId);
    if (result?.error) {
      alert(result.error);
    }
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="inline-flex items-center justify-center p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-600 transition-colors disabled:opacity-50"
      title="Reset Sent Today counter to 0"
    >
      <RotateCcw className={`w-3 h-3 ${loading ? "animate-spin text-blue-600" : ""}`} />
    </button>
  );
}

