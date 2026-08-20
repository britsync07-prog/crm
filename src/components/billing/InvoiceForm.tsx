"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import ClientSelect from "./ClientSelect";
import ActionModal from "./ActionModal";
import { createClientAction } from "@/app/billing/actions";
import type { InvoiceItem } from "@/lib/britledger/types";
import { generateInvoiceNumber, generateQuotationNumber, calculateSubtotal, calculateTax, calculateTotal, formatCurrency } from "@/lib/britledger/utils";

interface InvoiceFormProps {
  type: "invoice" | "quotation";
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}

export default function InvoiceForm({ type, onSave, saving }: InvoiceFormProps) {
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [docNumber, setDocNumber] = useState(
    type === "invoice" ? generateInvoiceNumber() : generateQuotationNumber()
  );
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, rate: 0, amount: 0, tax_rate: 20 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [paid, setPaid] = useState(false);
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("GBP");

  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);

  const subtotal = calculateSubtotal(items);
  const tax = items.reduce((sum, item) => {
    const lineAmount = item.amount ?? item.quantity * (item.rate ?? item.unit_price ?? 0);
    return sum + calculateTax(lineAmount, item.tax_rate ?? 0);
  }, 0);
  const total = calculateTotal(subtotal, tax, discount);
  const normalizedAdvancePayment = type === "invoice" ? (paid ? total : Math.min(Math.max(advancePayment, 0), total)) : 0;
  const balanceDue = Math.max(0, total - normalizedAdvancePayment);

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const next = { ...item, [field]: value };
      if (field === "quantity" || field === "rate" || field === "unit_price") {
        const qty = field === "quantity" ? Number(value) : item.quantity;
        const rate = field === "rate" || field === "unit_price" ? Number(value) : (item.rate ?? item.unit_price ?? 0);
        next.rate = rate;
        next.unit_price = rate;
        next.amount = qty * rate;
      }
      return next;
    });
    setItems(updated);
  }

  function addItem() {
    setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0, tax_rate: 20 }]);
  }

  function removeItem(index: number) {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  }

  async function handleCreateClient() {
    if (!newClientName) return;
    setCreatingClient(true);
    try {
      const res = await createClientAction({ name: newClientName, email: newClientEmail || undefined });
      if (res.success && res.data?.id) {
        setClientId(res.data.id);
        setClientName(res.data.name || newClientName);
        setShowNewClient(false);
        setNewClientName("");
        setNewClientEmail("");
      } else {
        window.alert(res.error || "Failed to create client");
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to create client");
    }
    setCreatingClient(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return;
    const payload = {
      client_id: clientId,
      ...(type === "invoice"
        ? { invoice_number: docNumber, due_date: dueDate }
        : { quotation_number: docNumber, expiry_date: dueDate }),
      issue_date: issueDate,
      total_amount: total,
      subtotal,
          tax,
      advance_payment: normalizedAdvancePayment,
      ...(type === "invoice" ? { status: paid ? "PAID" : "DRAFT" } : {}),
      currency,
      items: items
        .filter((i) => i.description)
        .map((item) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate ?? 0,
          unit_price: item.rate ?? 0,
          amount: item.amount ?? item.quantity * (item.rate ?? 0),
          total: item.amount ?? item.quantity * (item.rate ?? 0),
          tax_rate: item.tax_rate ?? 0,
        })),
      notes: notes || undefined,
    };
    await onSave(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Client</label>
          <ClientSelect
            value={clientId}
            selectedLabel={clientName}
            onChange={(id, name) => {
              setClientId(id);
              setClientName(name);
            }}
            onAddNew={() => setShowNewClient(true)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
            {type === "invoice" ? "Invoice Number" : "Quotation Number"}
          </label>
          <input
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Issue Date</label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
            {type === "invoice" ? "Due Date" : "Expiry Date"}
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
          >
            <option value="GBP">GBP (£)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
        {type === "invoice" && (
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Payment Status</label>
            <div className="grid grid-cols-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setPaid(false)}
                className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-widest transition-colors ${!paid ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
              >
                Unpaid
              </button>
              <button
                type="button"
                onClick={() => setPaid(true)}
                className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-widest transition-colors ${paid ? "bg-green-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
              >
                Paid
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Line Items</label>
        <div className="space-y-3 md:hidden">
          {items.map((item, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Service or Product</label>
                <input
                  value={item.description}
                  onChange={(e) => updateItem(i, "description", e.target.value)}
                  placeholder="e.g. Website design"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Qty</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold text-right"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Unit Cost</label>
                  <input
                    type="number"
                    value={item.rate}
                    onChange={(e) => updateItem(i, "rate", Number(e.target.value))}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold text-right"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">VAT %</label>
                  <input
                    type="number"
                    value={item.tax_rate ?? 0}
                    onChange={(e) => updateItem(i, "tax_rate", Number(e.target.value))}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold text-right"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-white/5 pt-3">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Line Total</span>
                <div className="flex items-center gap-3">
                  <span className="font-black text-zinc-900 dark:text-white">{formatCurrency(item.amount ?? 0, currency)}</span>
                  <button type="button" onClick={() => removeItem(i)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="w-full px-6 py-3 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#012169] bg-blue-50 dark:bg-blue-950/20">
            <Plus className="w-3 h-3" /> Add Line Item
          </button>
        </div>
        <div className="overflow-hidden rounded-[24px] sm:rounded-[32px] border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950">
          <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left font-black text-[10px] uppercase tracking-widest text-zinc-500">Description</th>
                <th className="px-6 py-3 text-right font-black text-[10px] uppercase tracking-widest text-zinc-500">Qty</th>
                <th className="px-6 py-3 text-right font-black text-[10px] uppercase tracking-widest text-zinc-500">Unit Cost</th>
                <th className="px-6 py-3 text-right font-black text-[10px] uppercase tracking-widest text-zinc-500">VAT %</th>
                <th className="px-6 py-3 text-right font-black text-[10px] uppercase tracking-widest text-zinc-500">Amount</th>
                <th className="px-6 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="px-6 py-2">
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      placeholder="e.g. Website design"
                      className="w-full px-3 py-2 rounded-lg bg-transparent text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
                    />
                  </td>
                  <td className="px-6 py-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                      min="1"
                      className="w-20 px-3 py-2 rounded-lg bg-transparent text-sm font-bold text-zinc-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-[#012169]"
                    />
                  </td>
                  <td className="px-6 py-2">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateItem(i, "rate", Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="w-24 px-3 py-2 rounded-lg bg-transparent text-sm font-bold text-zinc-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-[#012169]"
                    />
                  </td>
                  <td className="px-6 py-2">
                    <input
                      type="number"
                      value={item.tax_rate ?? 0}
                      onChange={(e) => updateItem(i, "tax_rate", Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="w-20 px-3 py-2 rounded-lg bg-transparent text-sm font-bold text-zinc-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-[#012169]"
                    />
                  </td>
                  <td className="px-6 py-2 text-right font-black text-zinc-900 dark:text-white">
                      {formatCurrency(item.amount ?? 0, currency)}
                  </td>
                  <td className="px-6 py-2">
                    <button type="button" onClick={() => removeItem(i)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <button type="button" onClick={addItem} className="hidden md:flex w-full px-6 py-3 items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#012169] hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors border-t border-zinc-100 dark:border-white/5">
            <Plus className="w-3 h-3" /> Add Line Item
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-full sm:w-80 space-y-3 p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
          <div className="flex justify-between text-sm">
            <span className="font-bold text-zinc-500">Subtotal</span>
            <span className="font-black text-zinc-900 dark:text-white">{formatCurrency(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-bold text-zinc-500">VAT</span>
            <span className="font-black text-zinc-900 dark:text-white">{formatCurrency(tax, currency)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="font-bold text-zinc-500" htmlFor="invoice-discount">Discount</label>
            <input
              id="invoice-discount"
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
              className="w-28 px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
          </div>
          {type === "invoice" && (
            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="font-bold text-zinc-500" htmlFor="invoice-advance">Advance Paid</label>
              <input
                id="invoice-advance"
                type="number"
                min="0"
                max={total}
                step="0.01"
                value={paid ? total : advancePayment}
                disabled={paid}
                onChange={(e) => setAdvancePayment(Math.max(0, Number(e.target.value) || 0))}
                className="w-28 px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-[#012169] disabled:opacity-60"
              />
            </div>
          )}
          <div className="pt-3 border-t border-zinc-200 dark:border-white/10 flex justify-between text-base">
            <span className="font-black uppercase tracking-wider">Total</span>
            <span className="font-black text-[#012169] dark:text-blue-300">{formatCurrency(total, currency)}</span>
          </div>
          {type === "invoice" && (
            <div className="pt-3 border-t border-zinc-200 dark:border-white/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-zinc-500">Advance Paid</span>
                <span className="font-black text-green-600">-{formatCurrency(normalizedAdvancePayment, currency)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="font-black uppercase tracking-wider">Balance Due</span>
                <span className="font-black text-[#012169] dark:text-blue-300">{formatCurrency(balanceDue, currency)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Notes / Terms</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169] resize-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!clientId || saving}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl disabled:opacity-40"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
              Creating...
            </span>
          ) : (
            `Create ${type === "invoice" ? "Invoice" : "Quotation"}`
          )}
        </button>
      </div>

      {showNewClient && (
        <ActionModal
          isOpen={showNewClient}
          onClose={() => setShowNewClient(false)}
          title="New Client"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Name *</label>
              <input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#012169]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Email</label>
              <input
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#012169]"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateClient}
              disabled={!newClientName || creatingClient}
              className="w-full rounded-xl bg-[#012169] text-white py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40"
            >
              {creatingClient ? "Creating..." : "Create Client"}
            </button>
          </div>
        </ActionModal>
      )}
    </form>
  );
}
