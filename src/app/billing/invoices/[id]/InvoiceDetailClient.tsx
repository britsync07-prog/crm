"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, CheckCircle, AlertTriangle, Send, XCircle } from "lucide-react";
import StatusBadge from "@/components/billing/StatusBadge";
import ActionModal from "@/components/billing/ActionModal";
import { formatCurrency, formatDate, normalizeStatus, getItemRate, getItemAmount } from "@/lib/britledger/utils";
import { cancelInvoiceAction, recordPaymentAction, sendInvoiceAction } from "@/app/billing/actions";
import type { Invoice, Client } from "@/lib/britledger/types";

interface ClientProps {
  invoice: Invoice;
  client: Client | null;
  id: string;
}

export default function InvoiceDetailClient({ invoice, client, id }: ClientProps) {
  const router = useRouter();
  const advancePayment = Math.max(Number(invoice.advance_payment || 0), 0);
  const balanceDue = Math.max(Number(invoice.total_amount || 0) - advancePayment, 0);
  const [showPay, setShowPay] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [payAmount, setPayAmount] = useState(balanceDue || invoice.total_amount);
  const [sendEmail, setSendEmail] = useState(client?.email || "");
  const [sendSubject, setSendSubject] = useState(`Invoice ${invoice.invoice_number}`);
  const [sendMessage, setSendMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleRecordPayment() {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await recordPaymentAction(id, { amount: payAmount, currency: invoice.currency });
      if (res.success) {
        setNotice("Payment recorded");
        setShowPay(false);
        router.refresh();
      } else {
        setActionError(res.error || "Payment failed");
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Payment failed");
    }
    setActionLoading(false);
  }

  async function handleSendInvoice() {
    if (!sendEmail) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await sendInvoiceAction(id, {
        to_email: sendEmail,
        subject: sendSubject || undefined,
        personal_message: sendMessage || undefined,
        include_payment_link: invStatus !== "Paid",
        status: invStatus === "Paid" ? "PAID" : "SENT",
      });
      if (res.success) {
        setNotice("Invoice sent");
        setShowSend(false);
        router.refresh();
      } else {
        setActionError(res.error || "Failed to send invoice");
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to send invoice");
    }
    setActionLoading(false);
  }

  async function handleCancelInvoice() {
    if (!window.confirm("Cancel this invoice?")) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await cancelInvoiceAction(id);
      if (res.success) {
        setNotice("Invoice cancelled");
        router.refresh();
      } else {
        setActionError(res.error || "Failed to cancel invoice");
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to cancel invoice");
    }
    setActionLoading(false);
  }

  const invStatus = normalizeStatus(invoice.status);
  const canSend = invStatus === "Draft";
  const canRecordPayment = invStatus === "Sent" || invStatus === "Overdue" || invStatus === "Partial";
  const canCancel = invStatus === "Draft" || invStatus === "Sent" || invStatus === "Overdue" || invStatus === "Partial";

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="text-2xl font-black uppercase italic tracking-tight">#{invoice.invoice_number}</h2>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="text-zinc-500 font-medium">{client?.name || invoice.client_id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canSend && (
            <button onClick={() => setShowSend(true)} disabled={actionLoading} className="flex items-center gap-2 rounded-xl bg-[#012169] text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg disabled:opacity-40">
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          )}
          {canRecordPayment && (
            <button onClick={() => setShowPay(true)} disabled={actionLoading} className="flex items-center gap-2 rounded-xl bg-green-600 text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg disabled:opacity-40">
              <CreditCard className="w-3.5 h-3.5" /> Record Payment
            </button>
          )}
          {notice && (
            <span className="flex items-center gap-2 text-green-600 text-[10px] font-black uppercase tracking-widest">
              <CheckCircle className="w-3.5 h-3.5" /> {notice}
            </span>
          )}
          {actionError && (
            <span className="flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest">
              <AlertTriangle className="w-3.5 h-3.5" /> {actionError}
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-950 rounded-[24px] sm:rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm p-5 sm:p-8 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Client</p>
                <p className="font-black text-zinc-900 dark:text-white mt-1">{client?.name || invoice.client_id}</p>
                {client?.email && <p className="text-sm text-zinc-500 mt-0.5">{client.email}</p>}
                {client?.company_name && <p className="text-sm text-zinc-500 mt-0.5">{client.company_name}</p>}
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Amount</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{formatCurrency(invoice.total_amount, invoice.currency)}</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
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
            <div className="bg-white dark:bg-zinc-950 rounded-[24px] sm:rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
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
                  {advancePayment > 0 && (
                    <>
                      <tr>
                        <td colSpan={3} className="px-8 py-2 text-right font-bold text-zinc-500">Advance Paid</td>
                        <td className="px-8 py-2 text-right font-black text-green-600">-{formatCurrency(advancePayment, invoice.currency)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-8 py-4 text-right font-black text-zinc-900 dark:text-white uppercase">Balance Due</td>
                        <td className="px-8 py-4 text-right font-black text-[#012169] dark:text-blue-300 text-lg">{formatCurrency(balanceDue, invoice.currency)}</td>
                      </tr>
                    </>
                  )}
                </tfoot>
              </table>
              </div>
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
              {canSend && (
                <button onClick={() => setShowSend(true)} disabled={actionLoading} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-sm font-bold transition-colors text-left disabled:opacity-40">
                  <Send className="w-4 h-4 text-[#012169]" /> Send Invoice
                </button>
              )}
              {canRecordPayment && (
                <button onClick={() => setShowPay(true)} disabled={actionLoading} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-sm font-bold transition-colors text-left disabled:opacity-40">
                  <CreditCard className="w-4 h-4 text-green-600" /> Record Payment
                </button>
              )}
              {canCancel && (
                <button onClick={handleCancelInvoice} disabled={actionLoading} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-bold transition-colors text-left text-red-600 disabled:opacity-40">
                  <XCircle className="w-4 h-4" /> Cancel Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ActionModal isOpen={showSend} onClose={() => setShowSend(false)} title="Send Invoice">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Recipient Email</label>
            <input type="email" value={sendEmail} onChange={(e) => setSendEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#012169]" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Subject</label>
            <input value={sendSubject} onChange={(e) => setSendSubject(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#012169]" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Message</label>
            <textarea value={sendMessage} onChange={(e) => setSendMessage(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#012169] resize-none" />
          </div>
          <button onClick={handleSendInvoice} disabled={!sendEmail || actionLoading} className="w-full rounded-xl bg-[#012169] text-white py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40">
            {actionLoading ? "Sending..." : "Send Invoice"}
          </button>
        </div>
      </ActionModal>

      <ActionModal isOpen={showPay} onClose={() => setShowPay(false)} title="Record Payment">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Amount</label>
            <input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} min="0" max={balanceDue || invoice.total_amount} step="0.01" className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#012169]" />
            <p className="text-xs font-bold text-zinc-500">Balance due: {formatCurrency(balanceDue, invoice.currency)}</p>
          </div>
          <button onClick={handleRecordPayment} disabled={!payAmount || actionLoading} className="w-full rounded-xl bg-green-600 text-white py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40">
            {actionLoading ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </ActionModal>
    </>
  );
}
