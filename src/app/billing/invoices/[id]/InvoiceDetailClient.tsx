"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, CheckCircle, AlertTriangle } from "lucide-react";
import StatusBadge from "@/components/billing/StatusBadge";
import ActionModal from "@/components/billing/ActionModal";
import { formatCurrency, formatDate, normalizeStatus, getItemRate, getItemAmount } from "@/lib/britledger/utils";
import { recordPaymentAction } from "@/app/billing/actions";
import type { Invoice, Client } from "@/lib/britledger/types";

interface ClientProps {
  invoice: Invoice;
  client: Client | null;
  id: string;
}

export default function InvoiceDetailClient({ invoice, client, id }: ClientProps) {
  const router = useRouter();
  const [showPay, setShowPay] = useState(false);
  const [payAmount, setPayAmount] = useState(invoice.total_amount);
  const [actionLoading, setActionLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  async function handleRecordPayment() {
    setActionLoading(true);
    setPayError(null);
    try {
      const res = await recordPaymentAction(id, { amount: payAmount });
      if (res.success) {
        setPaySuccess(true);
        setShowPay(false);
        router.refresh();
      } else {
        setPayError(res.error || "Payment failed");
      }
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Payment failed");
    }
    setActionLoading(false);
  }

  const invStatus = normalizeStatus(invoice.status);
  const canRecordPayment = invStatus === "Sent" || invStatus === "Overdue";

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-2xl font-black uppercase italic tracking-tight">#{invoice.invoice_number}</h2>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="text-zinc-500 font-medium">{client?.name || invoice.client_id}</p>
        </div>
        <div className="flex items-center gap-3">
          {canRecordPayment && (
            <button onClick={() => setShowPay(true)} className="flex items-center gap-2 rounded-xl bg-green-600 text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg">
              <CreditCard className="w-3.5 h-3.5" /> Record Payment
            </button>
          )}
          {paySuccess && (
            <span className="flex items-center gap-2 text-green-600 text-[10px] font-black uppercase tracking-widest">
              <CheckCircle className="w-3.5 h-3.5" /> Payment Recorded
            </span>
          )}
          {payError && (
            <span className="flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest">
              <AlertTriangle className="w-3.5 h-3.5" /> {payError}
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
                <p className="font-black text-zinc-900 dark:text-white mt-1">{client?.name || invoice.client_id}</p>
                {client?.email && <p className="text-sm text-zinc-500 mt-0.5">{client.email}</p>}
                {client?.company_name && <p className="text-sm text-zinc-500 mt-0.5">{client.company_name}</p>}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Amount</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{formatCurrency(invoice.total_amount, invoice.currency)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Issue Date</p>
                <p className="font-bold text-zinc-900 dark:text-white mt-1">{formatDate(invoice.issue_date)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Due Date</p>
                <p className="font-bold text-zinc-900 dark:text-white mt-1">{formatDate(invoice.due_date)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Currency</p>
                <p className="font-bold text-zinc-900 dark:text-white mt-1">{invoice.currency}</p>
              </div>
            </div>
          </div>

          {(invoice.items && invoice.items.length > 0) && (
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
                  {invoice.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-8 py-4 font-bold text-zinc-900 dark:text-white">{item.description}</td>
                      <td className="px-8 py-4 text-right font-bold text-zinc-700 dark:text-zinc-300">{item.quantity}</td>
                      <td className="px-8 py-4 text-right font-bold text-zinc-700 dark:text-zinc-300">{formatCurrency(getItemRate(item), invoice.currency)}</td>
                      <td className="px-8 py-4 text-right font-black text-zinc-900 dark:text-white">{formatCurrency(getItemAmount(item), invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5">
                  <tr>
                    <td colSpan={3} className="px-8 py-4 text-right font-bold text-zinc-500">Subtotal</td>
                    <td className="px-8 py-4 text-right font-black text-zinc-900 dark:text-white">{formatCurrency(invoice.subtotal_amount, invoice.currency)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-8 py-2 text-right font-bold text-zinc-500">VAT</td>
                    <td className="px-8 py-2 text-right font-black text-zinc-900 dark:text-white">{formatCurrency(invoice.tax_amount, invoice.currency)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-8 py-4 text-right font-black text-zinc-900 dark:text-white uppercase">Total</td>
                    <td className="px-8 py-4 text-right font-black text-[#012169] dark:text-blue-300 text-lg">{formatCurrency(invoice.total_amount, invoice.currency)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {invoice.notes && (
            <div className="bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm p-8">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3">Notes</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">{invoice.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm p-6 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Actions</h3>
            <div className="space-y-2">
              {canRecordPayment && (
                <button onClick={() => setShowPay(true)} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-sm font-bold transition-colors text-left">
                  <CreditCard className="w-4 h-4 text-green-600" /> Record Payment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ActionModal isOpen={showPay} onClose={() => setShowPay(false)} title="Record Payment">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Amount</label>
            <input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} step="0.01" className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#012169]" />
          </div>
          <button onClick={handleRecordPayment} disabled={!payAmount || actionLoading} className="w-full rounded-xl bg-green-600 text-white py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40">
            {actionLoading ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </ActionModal>
    </>
  );
}
