"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/billing/StatusBadge";
import ActionModal from "@/components/billing/ActionModal";
import { formatCurrency, formatDate, normalizeStatus, getItemRate, getItemAmount } from "@/lib/britledger/utils";
import { getQuotation } from "@/lib/britledger/quotations";
import { getClient } from "@/lib/britledger/clients";
import { sendQuotationAction } from "@/app/billing/actions";
import type { Quotation, Client } from "@/lib/britledger/types";

export default function QuotationDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const router = useRouter();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [clientError, setClientError] = useState(false);

  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const quoRes = await getQuotation(id);
        setQuotation(quoRes.data);
        try {
          const clRes = await getClient(quoRes.data.client_id);
          setClient(clRes.data);
        } catch (e) {
          setClientError(true);
          if (process.env.NODE_ENV === "development") console.warn("[QuotationDetail] Client load failed:", e);
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load quotation");
        if (process.env.NODE_ENV === "development") console.error("[QuotationDetail]", e);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSend() {
    setSending(true);
    setSendError(null);
    try {
      await sendQuotationAction(id);
      setSendSuccess(true);
      setQuotation((prev) => prev ? { ...prev, status: "Sent" as const } : null);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Failed to send");
      if (process.env.NODE_ENV === "development") console.error("[QuotationDetail] Send error:", e);
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-[#012169] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-32 space-y-4">
        <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
        <p className="text-zinc-500 font-medium italic">{loadError}</p>
        <Link href="/billing/quotations" className="text-[10px] font-black uppercase text-[#012169] tracking-[0.2em]">← Back to Quotations</Link>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="text-center py-32 space-y-4">
        <p className="text-zinc-500 font-medium italic">Quotation not found.</p>
        <Link href="/billing/quotations" className="text-[10px] font-black uppercase text-[#012169] tracking-[0.2em]">← Back to Quotations</Link>
      </div>
    );
  }

  const quoStatus = normalizeStatus(quotation.status);
  const canSend = quoStatus === "Draft";

  return (
    <div className="max-w-4xl space-y-8">
      <Link href="/billing/quotations" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#012169] transition-colors">
        <ArrowLeft className="w-3 h-3" /> Back to Quotations
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-2xl font-black uppercase italic tracking-tight">#{quotation.quotation_number}</h2>
            <StatusBadge status={quotation.status} />
          </div>
          <p className="text-zinc-500 font-medium">{client?.name || quotation.client_id}</p>
        </div>
        <div className="flex items-center gap-3">
          {canSend && (
            <button onClick={handleSend} disabled={sending} className="flex items-center gap-2 rounded-xl bg-[#012169] text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg disabled:opacity-40">
              <Send className="w-3.5 h-3.5" /> {sending ? "Sending..." : "Send to Client"}
            </button>
          )}
          {sendSuccess && (
            <span className="flex items-center gap-2 text-green-600 text-[10px] font-black uppercase tracking-widest">
              <CheckCircle className="w-3.5 h-3.5" /> Sent
            </span>
          )}
          {sendError && (
            <span className="flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest">
              <AlertTriangle className="w-3.5 h-3.5" /> {sendError}
            </span>
          )}
          {clientError && (
            <span className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest">
              <AlertTriangle className="w-3.5 h-3.5" /> Client data unavailable
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Client</p>
                <p className="font-black text-zinc-900 dark:text-white mt-1">{client?.name || quotation.client_id}</p>
                {client?.email && <p className="text-sm text-zinc-500 mt-0.5">{client.email}</p>}
                {client?.company_name && <p className="text-sm text-zinc-500 mt-0.5">{client.company_name}</p>}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Amount</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{formatCurrency(quotation.total_amount, quotation.currency)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Issue Date</p>
                <p className="font-bold text-zinc-900 dark:text-white mt-1">{formatDate(quotation.issue_date)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Expiry Date</p>
                <p className="font-bold text-zinc-900 dark:text-white mt-1">{formatDate(quotation.expiry_date)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Currency</p>
                <p className="font-bold text-zinc-900 dark:text-white mt-1">{quotation.currency}</p>
              </div>
            </div>
          </div>

          {(quotation.items && quotation.items.length > 0) && (
            <div className="bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5">
                  <tr>
                    <th className="px-8 py-4 text-left font-black text-[10px] uppercase tracking-widest text-zinc-500">Description</th>
                    <th className="px-8 py-4 text-right font-black text-[10px] uppercase tracking-widest text-zinc-500">Qty</th>
                    <th className="px-8 py-4 text-right font-black text-[10px] uppercase tracking-widest text-zinc-500">Rate</th>
                    <th className="px-8 py-4 text-right font-black text-[10px] uppercase tracking-widest text-zinc-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                  {quotation.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-8 py-4 font-bold text-zinc-900 dark:text-white">{item.description}</td>
                      <td className="px-8 py-4 text-right font-bold text-zinc-700 dark:text-zinc-300">{item.quantity}</td>
                      <td className="px-8 py-4 text-right font-bold text-zinc-700 dark:text-zinc-300">{formatCurrency(getItemRate(item), quotation.currency)}</td>
                      <td className="px-8 py-4 text-right font-black text-zinc-900 dark:text-white">{formatCurrency(getItemAmount(item), quotation.currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5">
                  <tr>
                    <td colSpan={3} className="px-8 py-4 text-right font-bold text-zinc-500">Subtotal</td>
                    <td className="px-8 py-4 text-right font-black text-zinc-900 dark:text-white">{formatCurrency(quotation.subtotal_amount, quotation.currency)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-8 py-2 text-right font-bold text-zinc-500">VAT</td>
                    <td className="px-8 py-2 text-right font-black text-zinc-900 dark:text-white">{formatCurrency(quotation.tax_amount, quotation.currency)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-8 py-4 text-right font-black text-zinc-900 dark:text-white uppercase">Total</td>
                    <td className="px-8 py-4 text-right font-black text-[#012169] dark:text-blue-300 text-lg">{formatCurrency(quotation.total_amount, quotation.currency)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {quotation.notes && (
            <div className="bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm p-8">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3">Notes</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">{quotation.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm p-6 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Actions</h3>
            <div className="space-y-2">
              {canSend && (
                <button onClick={handleSend} disabled={sending} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-sm font-bold transition-colors text-left disabled:opacity-40">
                  <Send className="w-4 h-4 text-[#012169]" /> {sending ? "Sending..." : "Send to Client"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
