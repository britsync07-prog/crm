import type { Quotation } from "@/lib/britledger/types";
import { listQuotations } from "@/lib/britledger/quotations";
import { listClients } from "@/lib/britledger/clients";
import StatusBadge from "@/components/billing/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/britledger/utils";
import { FileSignature, Plus, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

export default async function QuotationList(props: Props) {
  const sp = await props.searchParams;
  const status = sp.status;
  const page = parseInt(sp.page || "1");

  let quotations: Quotation[] = [];
  let total = 0;
  const clientMap: Record<string, string> = {};
  let loadError = false;

  try {
    const [quoRes, clRes] = await Promise.all([
      listQuotations({ page, page_size: 20, status }),
      listClients(),
    ]);
    quotations = quoRes.data || [];
    total = quoRes.total || 0;
    for (const c of clRes.data || []) {
      clientMap[c.id] = c.name;
    }
  } catch (e) {
    loadError = true;
    if (process.env.NODE_ENV === "development") console.error("[Quotations] Failed to load:", e);
  }

  if (loadError) {
    return (
      <div className="text-center py-24 space-y-4">
        <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
        <p className="text-zinc-500 font-medium italic">Could not load quotations.</p>
        <p className="text-[10px] text-zinc-400 font-bold">BritLedger may be unavailable. Try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase italic tracking-tight">Quotations</h2>
          <p className="text-zinc-500 text-sm mt-1">{total} quotation{total !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/billing/quotations/new"
          className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
        >
          <Plus className="w-4 h-4" /> New Quotation
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
              <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Expires</th>
              <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
            {quotations.map((q) => (
              <tr key={q.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-5">
                  <Link href={`/billing/quotations/${q.id}`} className="font-black text-zinc-900 dark:text-white uppercase tracking-tighter hover:text-[#012169] transition-colors">
                    #{q.quotation_number}
                  </Link>
                </td>
                <td className="px-8 py-5 font-bold text-zinc-700 dark:text-zinc-300">{clientMap[q.client_id] || q.client_id}</td>
                <td className="px-8 py-5 font-black text-zinc-900 dark:text-white">{formatCurrency(q.total_amount, q.currency)}</td>
                <td className="px-8 py-5 font-bold text-zinc-500">{formatDate(q.issue_date)}</td>
                <td className="px-8 py-5 font-bold text-zinc-500">{formatDate(q.expiry_date)}</td>
                <td className="px-8 py-5 text-right"><StatusBadge status={q.status} /></td>
              </tr>
            ))}
            {quotations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <FileSignature className="w-8 h-8 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-zinc-500 font-medium italic">No quotations yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
