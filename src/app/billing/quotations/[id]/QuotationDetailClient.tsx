"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/billing/StatusBadge";
import { formatCurrency, formatDate, normalizeStatus, getItemRate, getItemAmount } from "@/lib/britledger/utils";
import { convertQuotationAction, sendQuotationAction } from "@/app/billing/actions";
import type { Quotation, Client } from "@/lib/britledger/types";

interface ClientProps {
  quotation: Quotation;
  client: Client | null;
  id: string;
}

export default function QuotationDetailClient({ quotation, client, id }: ClientProps) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [converting, setConverting] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(quotation.status);

  async function handleSend() {
    setSending(true);
    setSendError(null);
    try {
      const res = await sendQuotationAction(id);
      if (res.success) {
        setSendSuccess(true);
        setCurrentStatus("Sent");
      } else {
        setSendError(res.error || "Failed to send");
      }
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Failed to send");
    }
    setSending(false);
  }

  async function handleConvert() {
    setConverting(true);
    setSendError(null);
    try {
      const res = await convertQuotationAction(id);
      if (res.success && res.data?.invoice_id) {
        router.push(`/billing/invoices/${res.data.invoice_id}`);
      } else {
        setSendError(res.error || "Failed to convert");
      }
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Failed to convert");
    }
    setConverting(false);
  }

  const quoStatus = normalizeStatus(currentStatus);
  const canSend = quoStatus === "Draft";
  const canConvert = quoStatus === "Sent" || quoStatus === "Accepted";

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-2xl font-black uppercase italic tracking-tight">#{quotation.quotation_number}</h2>
            <StatusBadge status={currentStatus} />
          </div>
          <p className="text-zinc-500 font-medium">{client?.name || quotation.client_id}</p>
        </div>
        <div className="flex items-center gap-3">
          {canSend && (
            <button onClick={handleSend} disabled={sending} className="flex items-center gap-2 rounded-xl bg-[#012169] text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg disabled:opacity-40">
              <Send className="w-3.5 h-3.5" /> {sending ? "Sending..." : "Send to Client"}
            </button>
          )}
          {canConvert && (
            <button onClick={handleConvert} disabled={converting} className="flex items-center gap-2 rounded-xl bg-green-600 text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg disabled:opacity-40">
              <FileText className="w-3.5 h-3.5" /> {converting ? "Converting..." : "Convert to Invoice"}
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
              {canConvert && (
                <button onClick={handleConvert} disabled={converting} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-sm font-bold transition-colors text-left disabled:opacity-40">
                  <FileText className="w-4 h-4 text-green-600" /> {converting ? "Converting..." : "Convert to Invoice"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
