"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InvoiceForm from "@/components/billing/InvoiceForm";
import { createInvoiceAction } from "@/app/billing/actions";

export default function NewInvoicePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(data: any) {
    setSaving(true);
    setError("");
    const result = await createInvoiceAction(data);
    setSaving(false);
    if (result.success && result.data) {
      router.push(`/billing/invoices/${result.data.id}`);
    } else {
      setError(result.error || "Failed to create invoice");
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-xl font-black uppercase italic tracking-tight">New Invoice</h2>
        <p className="text-zinc-500 text-sm mt-1">Create a new invoice for a client.</p>
      </div>
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm font-bold text-red-600">{error}</div>
      )}
      <InvoiceForm type="invoice" onSave={handleSave} saving={saving} />
    </div>
  );
}
