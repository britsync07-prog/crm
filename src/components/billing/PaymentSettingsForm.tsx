"use client";

import { useState } from "react";
import { Building2, CreditCard, Landmark, Loader2, Save } from "lucide-react";
import { updatePaymentSettingsAction } from "@/app/billing/actions";
import type { PaymentSettings } from "@/lib/britledger/types";

export default function PaymentSettingsForm({ initialSettings }: { initialSettings: PaymentSettings }) {
  const [settings, setSettings] = useState<PaymentSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update<K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    const result = await updatePaymentSettingsAction(settings);
    setSaving(false);
    if (result.success) {
      setMessage("Payment settings saved");
    } else {
      setError(result.error || "Failed to save settings");
    }
  }

  const inputClass = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-[#012169] dark:border-white/10 dark:bg-zinc-950 dark:text-white";
  const labelClass = "space-y-2 text-[10px] font-black uppercase tracking-widest text-zinc-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(message || error) && (
        <div className={`rounded-2xl border px-5 py-4 text-sm font-bold ${error ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300" : "border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300"}`}>
          {error || message}
        </div>
      )}

      <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#012169]/10 text-[#012169] dark:bg-blue-500/10 dark:text-blue-300">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-black text-zinc-900 dark:text-white">Business Profile</h2>
            <p className="text-xs font-medium text-zinc-500">Used on invoices, payment emails, and PDF documents.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            VAT Number
            <input value={settings.company_vat_number || ""} onChange={(e) => update("company_vat_number", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Logo URL
            <input value={settings.company_logo_url || ""} onChange={(e) => update("company_logo_url", e.target.value)} className={inputClass} />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            Company Address
            <textarea value={settings.company_address || ""} onChange={(e) => update("company_address", e.target.value)} rows={3} className={`${inputClass} resize-y`} />
          </label>
        </div>
      </section>

      <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-black text-zinc-900 dark:text-white">Bank Transfer</h2>
            <p className="text-xs font-medium text-zinc-500">These details appear when manual bank payment is enabled.</p>
          </div>
        </div>
        <label className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" checked={Boolean(settings.bank_transfer_enabled)} onChange={(e) => update("bank_transfer_enabled", e.target.checked)} className="accent-[#012169]" />
          Enable bank transfer
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Bank Name
            <input value={settings.bank_name || ""} onChange={(e) => update("bank_name", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Account Name
            <input value={settings.account_name || ""} onChange={(e) => update("account_name", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Account Number
            <input value={settings.account_number || ""} onChange={(e) => update("account_number", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Sort Code
            <input value={settings.sort_code || ""} onChange={(e) => update("sort_code", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            IBAN
            <input value={settings.iban || ""} onChange={(e) => update("iban", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            SWIFT / BIC
            <input value={settings.swift_bic || ""} onChange={(e) => update("swift_bic", e.target.value)} className={inputClass} />
          </label>
        </div>
      </section>

      <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#012169] dark:bg-blue-500/10 dark:text-blue-300">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-black text-zinc-900 dark:text-white">Online Payments</h2>
            <p className="text-xs font-medium text-zinc-500">Connect payment rails used by BritLedger payment links.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={Boolean(settings.stripe_enabled)} onChange={(e) => update("stripe_enabled", e.target.checked)} className="accent-[#012169]" />
            Enable Stripe
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={Boolean(settings.paypal_enabled)} onChange={(e) => update("paypal_enabled", e.target.checked)} className="accent-[#012169]" />
            Enable PayPal
          </label>
          <label className={labelClass}>
            Stripe Public Key
            <input value={settings.stripe_public_key || ""} onChange={(e) => update("stripe_public_key", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Stripe Account ID
            <input value={settings.stripe_account_id || ""} onChange={(e) => update("stripe_account_id", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            PayPal Client ID
            <input value={settings.paypal_client_id || ""} onChange={(e) => update("paypal_client_id", e.target.value)} className={inputClass} />
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#012169] px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:opacity-90 disabled:opacity-50 sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Payment Settings
        </button>
      </div>
    </form>
  );
}
