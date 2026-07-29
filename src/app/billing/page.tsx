import type { RevenueReport, Invoice } from "@/lib/britledger/types";
import { getRevenueSummary } from "@/lib/britledger/reports";
import { listInvoices } from "@/lib/britledger/invoices";
import { listClients } from "@/lib/britledger/clients";
import StatusBadge from "@/components/billing/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/britledger/utils";
import { TrendingUp, Clock, AlertCircle, Users, ArrowUpRight, FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function BillingDashboard() {
  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  let revenue: RevenueReport | null = null;
  let invoices: Invoice[] = [];
  let clientsCount = 0;
  let revenueError = false;
  let invoicesError = false;
  let clientsError = false;

  const [revRes, invRes, clRes] = await Promise.allSettled([
    getRevenueSummary(yearStart, todayStr),
    listInvoices({ page: 1, page_size: 10 }),
    listClients({ page: 1, page_size: 1 })
  ]);

  if (revRes.status === "fulfilled") {
    revenue = revRes.value.data;
  } else {
    revenueError = true;
    if (process.env.NODE_ENV === "development") console.error("[Billing] Revenue error:", revRes.reason);
  }

  if (invRes.status === "fulfilled") {
    invoices = invRes.value.data || [];
  } else {
    invoicesError = true;
    if (process.env.NODE_ENV === "development") console.error("[Billing] Invoices error:", invRes.reason);
  }

  if (clRes.status === "fulfilled") {
    clientsCount = clRes.value.total || 0;
  } else {
    clientsError = true;
    if (process.env.NODE_ENV === "development") console.error("[Billing] Clients error:", clRes.reason);
  }

  const totalInvoiced = revenue?.total_invoiced ?? 0;
  const totalCollected = revenue?.total_collected ?? 0;
  const totalOutstanding = revenue?.total_outstanding ?? 0;
  const totalOverdue = revenue?.total_overdue ?? 0;

  return (
    <div className="space-y-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: formatCurrency(totalCollected), icon: TrendingUp, color: "text-green-500", trend: "YTD" },
          { label: "Outstanding AR", value: formatCurrency(totalOutstanding), icon: Clock, color: "text-amber-500", trend: "Unpaid" },
          { label: "Overdue", value: formatCurrency(totalOverdue), icon: AlertCircle, color: "text-red-500", trend: "Requires action" },
          { label: "Total Clients", value: clientsCount.toString(), icon: Users, color: "text-[#012169]", trend: "Registered" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-950 p-8 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <ArrowUpRight className="w-3 h-3" />
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {revenueError && (
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Revenue data unavailable — BritLedger report endpoint unreachable</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase italic tracking-tight">Recent Invoices</h2>
            <Link href="/billing/invoices" className="text-[10px] font-black uppercase text-[#012169] tracking-[0.2em]">View All →</Link>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-500">
                <tr>
                  <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Reference</th>
                  <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Date</th>
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
                    <td className="px-8 py-5 font-black text-zinc-900 dark:text-white">{formatCurrency(inv.total_amount, inv.currency)}</td>
                    <td className="px-8 py-5 font-bold text-zinc-500">{formatDate(inv.issue_date)}</td>
                    <td className="px-8 py-5 text-right"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <FileText className="w-8 h-8 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-zinc-500 font-medium italic">No invoices yet. Create your first one.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase italic tracking-tight">Quick Actions</h2>
          <div className="space-y-4">
            <Link
              href="/billing/invoices/new"
              className="block p-6 bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#012169]/10 dark:bg-[#012169]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-[#012169] dark:text-blue-300" />
                </div>
                <div>
                  <p className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">Create Invoice</p>
                  <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Bill a client for services</p>
                </div>
              </div>
            </Link>

            <Link
              href="/billing/quotations/new"
              className="block p-6 bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">New Quotation</p>
                  <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Quote a potential deal</p>
                </div>
              </div>
            </Link>

            <Link
              href="/billing/clients/new"
              className="block p-6 bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">Add Client</p>
                  <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Register a new billing client</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
