import type { RevenueReport, Invoice, ProfitLossReport, ExpenseReport, VATSummary, PaymentSettings } from "@/lib/britledger/types";
import { getExpenseSummary, getProfitLoss, getRevenueSummary } from "@/lib/britledger/reports";
import { listInvoices } from "@/lib/britledger/invoices";
import { listClients } from "@/lib/britledger/clients";
import { listExpenses, listLedger, listTransactions } from "@/lib/britledger/bookkeeping";
import { getCurrentQuarterVat } from "@/lib/britledger/vat";
import { getPaymentSettings } from "@/lib/britledger/payments";
import StatusBadge from "@/components/billing/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/britledger/utils";
import { TrendingUp, Clock, AlertCircle, Users, ArrowUpRight, FileText, AlertTriangle, ReceiptText, Landmark, WalletCards, BadgePoundSterling } from "lucide-react";
import Link from "next/link";

function normalizeRevenue(data: Partial<RevenueReport> | null): RevenueReport {
  return {
    total_invoiced: data?.total_invoiced ?? 0,
    total_collected: data?.total_collected ?? 0,
    total_outstanding: data?.total_outstanding ?? 0,
    total_overdue: data?.total_overdue ?? 0,
  };
}

function normalizeProfitLoss(data: Partial<ProfitLossReport> | null): ProfitLossReport {
  return {
    total_revenue: data?.total_revenue ?? 0,
    total_expenses: data?.total_expenses ?? 0,
    net_profit: data?.net_profit ?? 0,
  };
}

function normalizeExpenseReport(data: Partial<ExpenseReport> | null): ExpenseReport {
  return {
    total_expenses: data?.total_expenses ?? 0,
    by_category: data?.by_category ?? {},
    by_month: data?.by_month ?? {},
  };
}

function normalizeVat(data: Partial<VATSummary> | null): VATSummary {
  return {
    box1: data?.box1 ?? 0,
    box2: data?.box2 ?? 0,
    box3: data?.box3 ?? 0,
    box4: data?.box4 ?? 0,
    box5: data?.box5 ?? 0,
    box6: data?.box6 ?? 0,
    box7: data?.box7 ?? 0,
  };
}

export default async function BillingDashboard() {
  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  let revenue: RevenueReport = normalizeRevenue(null);
  let profitLoss: ProfitLossReport = normalizeProfitLoss(null);
  let expenseReport: ExpenseReport = normalizeExpenseReport(null);
  let vat: VATSummary = normalizeVat(null);
  let paymentSettings: PaymentSettings | null = null;
  let invoices: Invoice[] = [];
  let clientsCount = 0;
  let expensesCount = 0;
  let transactionsCount = 0;
  let ledgerCount = 0;
  let revenueError = false;
  let financeError = false;

  const [revRes, plRes, expReportRes, vatRes, paySettingsRes, expRes, txRes, ledgerRes, invRes, clRes] = await Promise.allSettled([
    getRevenueSummary(yearStart, todayStr),
    getProfitLoss(yearStart, todayStr),
    getExpenseSummary(yearStart, todayStr),
    getCurrentQuarterVat(),
    getPaymentSettings(),
    listExpenses({ page: 1, page_size: 5 }),
    listTransactions({ page: 1, page_size: 5 }),
    listLedger({ page: 1, page_size: 5 }),
    listInvoices({ page: 1, page_size: 10 }),
    listClients({ page: 1, page_size: 1 })
  ]);

  if (revRes.status === "fulfilled") {
    revenue = normalizeRevenue(revRes.value.data);
  } else {
    revenueError = true;
    if (process.env.NODE_ENV === "development") console.error("[Billing] Revenue error:", revRes.reason);
  }

  if (plRes.status === "fulfilled") profitLoss = normalizeProfitLoss(plRes.value.data);
  else financeError = true;

  if (expReportRes.status === "fulfilled") expenseReport = normalizeExpenseReport(expReportRes.value.data);
  else financeError = true;

  if (vatRes.status === "fulfilled") vat = normalizeVat(vatRes.value.data);
  else financeError = true;

  if (paySettingsRes.status === "fulfilled") paymentSettings = paySettingsRes.value;
  else financeError = true;

  if (expRes.status === "fulfilled") expensesCount = expRes.value.total || 0;
  else financeError = true;

  if (txRes.status === "fulfilled") transactionsCount = txRes.value.total || 0;
  else financeError = true;

  if (ledgerRes.status === "fulfilled") ledgerCount = ledgerRes.value.total || 0;
  else financeError = true;

  if (invRes.status === "fulfilled") {
    invoices = invRes.value.data || [];
  } else {
    if (process.env.NODE_ENV === "development") console.error("[Billing] Invoices error:", invRes.reason);
  }

  if (clRes.status === "fulfilled") {
    clientsCount = clRes.value.total || 0;
  } else {
    if (process.env.NODE_ENV === "development") console.error("[Billing] Clients error:", clRes.reason);
  }

  const totalInvoiced = revenue.total_invoiced;
  const totalCollected = revenue.total_collected ?? 0;
  const totalOutstanding = revenue.total_outstanding ?? 0;
  const totalOverdue = revenue.total_overdue ?? 0;
  const paymentMethodsEnabled = [
    paymentSettings?.stripe_enabled,
    paymentSettings?.paypal_enabled,
    paymentSettings?.bank_transfer_enabled,
  ].filter(Boolean).length;

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

      {financeError && (
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
          <AlertTriangle className="w-5 h-5 text-[#012169] shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#012169] dark:text-blue-300">Some finance modules returned sparse data. Available BritLedger data is still shown below.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: "Net Profit", value: formatCurrency(profitLoss.net_profit), icon: BadgePoundSterling, helper: "P&L" },
          { label: "Expenses", value: formatCurrency(expenseReport.total_expenses || profitLoss.total_expenses), icon: ReceiptText, helper: `${expensesCount} records` },
          { label: "VAT Due", value: formatCurrency((vat.box3 || 0) - (vat.box4 || 0)), icon: Landmark, helper: "Current quarter" },
          { label: "Payment Rails", value: paymentMethodsEnabled.toString(), icon: WalletCards, helper: "Stripe/PayPal/Bank" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-zinc-950 p-6 rounded-[24px] border border-zinc-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <stat.icon className="w-5 h-5 text-[#012169] dark:text-blue-300" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{stat.helper}</span>
            </div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Transactions</p>
          <p className="text-2xl font-black mt-2">{transactionsCount}</p>
        </div>
        <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ledger Entries</p>
          <p className="text-2xl font-black mt-2">{ledgerCount}</p>
        </div>
        <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Invoiced</p>
          <p className="text-2xl font-black mt-2">{formatCurrency(totalInvoiced)}</p>
        </div>
      </div>

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
