"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import ClientSelect from "./ClientSelect";
import ActionModal from "./ActionModal";
import { createClient } from "@/lib/britledger/clients";
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
    { description: "", quantity: 1, rate: 0, amount: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(20);
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("GBP");

  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);

  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(subtotal, taxRate);
  const total = calculateTotal(subtotal, tax);

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const next = { ...item, [field]: value };
      if (field === "quantity" || field === "rate") {
        const qty = field === "quantity" ? Number(value) : item.quantity;
        const rate = field === "rate" ? Number(value) : (item.rate ?? 0);
        next.amount = qty * rate;
      }
      return next;
    });
    setItems(updated);
  }

  function addItem() {
    setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  }

  function removeItem(index: number) {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  }

  async function handleCreateClient() {
    if (!newClientName) return;
    setCreatingClient(true);
    try {
      const res = await createClient({ name: newClientName, email: newClientEmail || undefined });
      if (!res?.data?.id) return;
      setClientId(res.data.id);
      setClientName(res.data.name ?? newClientName);
      setShowNewClient(false);
      setNewClientName("");
      setNewClientEmail("");
    } catch (err) { console.error('Failed to create client:', err); }
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
      currency,
      items: items.filter((i) => i.description),
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
            onChange={(id, name) => { setClientId(id); setClientName(name); }}
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
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Tax Rate (%)</label>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Line Items</label>
        <div className="overflow-hidden rounded-[32px] border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left font-black text-[10px] uppercase tracking-widest text-zinc-500">Description</th>
                <th className="px-6 py-3 text-right font-black text-[10px] uppercase tracking-widest text-zinc-500">Qty</th>
                <th className="px-6 py-3 text-right font-black text-[10px] uppercase tracking-widest text-zinc-500">Rate</th>
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
                      placeholder="Service or product..."
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
          <button type="button" onClick={addItem} className="w-full px-6 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#012169] hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors border-t border-zinc-100 dark:border-white/5">
            <Plus className="w-3 h-3" /> Add Line Item
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-72 space-y-3 p-6 rounded-[32px] bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
          <div className="flex justify-between text-sm">
            <span className="font-bold text-zinc-500">Subtotal</span>
            <span className="font-black text-zinc-900 dark:text-white">{formatCurrency(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-bold text-zinc-500">VAT ({taxRate}%)</span>
            <span className="font-black text-zinc-900 dark:text-white">{formatCurrency(tax, currency)}</span>
          </div>
          <div className="pt-3 border-t border-zinc-200 dark:border-white/10 flex justify-between text-base">
            <span className="font-black uppercase tracking-wider">Total</span>
            <span className="font-black text-[#012169] dark:text-blue-300">{formatCurrency(total, currency)}</span>
          </div>
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
          className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl disabled:opacity-40"
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
