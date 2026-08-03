"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import InvoiceForm from "@/components/billing/InvoiceForm";
import { createQuotationAction } from "@/app/billing/actions";

export default function NewQuotationPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(data: any) {
    setSaving(true);
    setError("");
    const result = await createQuotationAction(data);
    setSaving(false);
    if (result.success && result.data?.id) {
      router.push(`/billing/quotations/${result.data.id}`);
    } else if (result.success) {
      router.push("/billing/quotations");
    } else {
      setError(result.error || "Failed to create quotation");
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <Link href="/billing/quotations" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#012169] transition-colors">
        <ArrowLeft className="w-3 h-3" /> Back to Quotations
      </Link>

      <div>
        <h2 className="text-xl font-black uppercase italic tracking-tight">New Quotation</h2>
        <p className="text-zinc-500 text-sm mt-1">Create a quotation for a client.</p>
      </div>
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm font-bold text-red-600">{error}</div>
      )}
      <InvoiceForm type="quotation" onSave={handleSave} saving={saving} />
    </div>
  );
}
