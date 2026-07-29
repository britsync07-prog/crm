import type { Invoice } from "@/lib/britledger/types";
import { listInvoices } from "@/lib/britledger/invoices";
import { listClients } from "@/lib/britledger/clients";
import StatusBadge from "@/components/billing/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/britledger/utils";
import { FileText, Plus, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function InvoiceList(props: Props) {
  const sp = await props.searchParams;
  const status = sp.status;
  const search = sp.search;
  const page = parseInt(sp.page || "1");

  let invoices: Invoice[] = [];
  let total = 0;
  let totalPages = 0;
  let clientMap: Record<string, string> = {};
  let loadError = false;

  try {
    const [invRes, clRes] = await Promise.all([
      listInvoices({ page, page_size: 20, status, search }),
      listClients(),
    ]);
    invoices = invRes.data || [];
    total = invRes.total || 0;
    totalPages = invRes.total_pages || 0;
    for (const c of clRes.data || []) {
      clientMap[c.id] = c.name;
    }
  } catch (e) {
    loadError = true;
    if (process.env.NODE_ENV === "development") console.error("[Invoices] Failed to load:", e);
  }

  if (loadError) {
    return (
      <div className="text-center py-24 space-y-4">
        <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
        <p className="text-zinc-500 font-medium italic">Could not load invoices.</p>
        <p className="text-[10px] text-zinc-400 font-bold">BritLedger may be unavailable. Try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase italic tracking-tight">All Invoices</h2>
          <p className="text-zinc-500 text-sm mt-1">{total} total invoice{total !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/billing/invoices/new"
          className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
        >
          <Plus className="w-4 h-4" /> New Invoice
        </Link>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-500">
            <tr>
              <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Reference</th>
              <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Client</th>
              <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Amount</th>
              <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Issue Date</th>
              <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Due Date</th>
              <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-5">
                  <Link href={`/billing/invoices/${inv.id}`} className="font-black text-zinc-900 dark:text-white uppercase tracking-tighter hover:text-[#012169] transition-colors">
                    #{inv.invoice_number}
                  </Link>
                </td>
                <td className="px-8 py-5 font-bold text-zinc-700 dark:text-zinc-300">{clientMap[inv.client_id] || inv.client_id}</td>
                <td className="px-8 py-5 font-black text-zinc-900 dark:text-white">{formatCurrency(inv.total_amount, inv.currency)}</td>
                <td className="px-8 py-5 font-bold text-zinc-500">{formatDate(inv.issue_date)}</td>
                <td className="px-8 py-5 font-bold text-zinc-500">{formatDate(inv.due_date)}</td>
                <td className="px-8 py-5 text-right"><StatusBadge status={inv.status} /></td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-zinc-500 font-medium italic">No invoices found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/billing/invoices?page=${p}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                p === page
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-black"
                  : "bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
