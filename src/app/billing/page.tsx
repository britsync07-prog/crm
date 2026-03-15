import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default async function BillingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const userId = session.id;

  // In a real app, we'd fetch actual financial data.
  // For this OS, we fetch related customer invoices and subscriptions.
  const invoices = await prisma.invoice.findMany({
    where: { customer: { userId } },
    include: { customer: true },
    orderBy: { createdAt: "desc" }
  });

  const subscriptions = await prisma.subscription.findMany({
    where: { customer: { userId } },
    include: { customer: true }
  });

  const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.status === "Paid" ? inv.amount : 0), 0);
  const pendingRevenue = invoices.reduce((acc, inv) => acc + (inv.status === "Sent" ? inv.amount : 0), 0);

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-500" /> Capital <span className="text-green-500 not-italic">&</span> Ledger
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Enterprise financial oversight and automated billing.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/billing/invoices/new"
            className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
          >
            <FileText className="w-4 h-4" /> Create Invoice
          </Link>
        </div>
      </div>

      {/* Financial Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-green-500", trend: "+12.5%", positive: true },
          { label: "Pending AR", value: `$${pendingRevenue.toLocaleString()}`, icon: Clock, color: "text-amber-500", trend: "-2.1%", positive: false },
          { label: "Active Subs", value: subscriptions.length.toString(), icon: CreditCard, color: "text-[#012169]", trend: "+4", positive: true },
          { label: "LTV Average", value: "$4,250", icon: DollarSign, color: "text-blue-500", trend: "+18%", positive: true }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-950 p-8 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${stat.positive ? 'text-green-500' : 'text-red-500'}`}>
                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Ledger */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase italic tracking-tight">Recent Invoices</h2>
            <Link href="/billing/invoices" className="text-[10px] font-black uppercase text-[#012169] tracking-[0.2em]">View Ledger →</Link>
          </div>
          
          <div className="overflow-hidden rounded-[32px] border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-500">
                <tr>
                  <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Reference</th>
                  <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Client</th>
                  <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5 font-bold text-zinc-900 dark:text-white uppercase tracking-tighter">#{inv.invoiceRef}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-black">
                          {inv.customer.name[0]}
                        </div>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">{inv.customer.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-black text-zinc-900 dark:text-white">${inv.amount.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                        inv.status === "Paid" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" :
                        inv.status === "Overdue" ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" :
                        "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-400"
                      }`}>
                        {inv.status === "Paid" && <CheckCircle2 className="w-3 h-3" />}
                        {inv.status === "Overdue" && <AlertCircle className="w-3 h-3" />}
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <p className="text-zinc-500 font-medium italic">No invoices issued in this cycle.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscription Engine */}
        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase italic tracking-tight">Recurring Revenue</h2>
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="p-6 bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                  <CreditCard className="w-12 h-12" />
                </div>
                <div className="space-y-4 relative z-10">
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#012169] tracking-[0.2em]">{sub.planName}</p>
                    <h4 className="text-lg font-black text-zinc-900 dark:text-white mt-1">{sub.customer.name}</h4>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-black text-zinc-900 dark:text-white">${sub.amount.toLocaleString()}</span>
                    <span className="text-zinc-400 text-[10px] font-bold uppercase mb-1.5">/{sub.interval.toLowerCase()}</span>
                  </div>
                  <div className="pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Active</span>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Next: {new Date(sub.nextBilling).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {subscriptions.length === 0 && (
              <div className="p-12 text-center border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-[32px] opacity-30">
                <CreditCard className="w-8 h-8 mx-auto mb-4 text-zinc-400" />
                <p className="text-[10px] font-black uppercase tracking-widest">No active subscriptions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
