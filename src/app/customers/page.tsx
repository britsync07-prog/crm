import { prisma } from "@/lib/db";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Users, Plus, Mail, Building2, ChevronRight, UserCircle2, ShieldCheck, Sparkles } from "lucide-react";

export default async function CustomersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const userId = session.id;

  const customers = await prisma.customer.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16 pb-32">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 pb-4 border-b border-zinc-100 dark:border-zinc-900/50">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-[1.5rem] bg-[#012169] flex items-center justify-center shadow-2xl shadow-blue-900/20">
               <Users className="w-7 h-7 text-white" />
             </div>
             <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-zinc-50 leading-none">
              Client Base
            </h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-1">Centralized Intelligence Hub</p>
        </div>
        
        <Link
          href="/customers/new"
          className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-[1.5rem] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-blue-900/10 flex items-center justify-center gap-3 ring-2 ring-transparent hover:ring-blue-700/30"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Enroll New Client
        </Link>
      </div>

      {/* Desktop Table View - Hidden on Mobile */}
      <div className="hidden md:block overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-900 dark:bg-zinc-950 shelf-shadow border-b-[6px]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/50 text-zinc-400 dark:border-zinc-900 dark:bg-zinc-900/30">
            <tr>
              <th className="px-8 py-6 font-black uppercase tracking-widest text-[10px]">Identification</th>
              <th className="px-8 py-6 font-black uppercase tracking-widest text-[10px]">Contact Channel</th>
              <th className="px-8 py-6 font-black uppercase tracking-widest text-[10px]">Organization</th>
              <th className="px-8 py-6 font-black uppercase tracking-widest text-[10px]">Status</th>
              <th className="px-8 py-6 font-black uppercase tracking-widest text-[10px] text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900 text-zinc-900 dark:text-zinc-100 italic font-medium">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-blue-50/30 dark:hover:bg-[#012169]/5 transition-colors group">
                <td className="px-8 py-8">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-[#012169] transition-colors">
                        <UserCircle2 className="w-6 h-6" />
                      </div>
                      <span className="font-black uppercase tracking-tighter text-lg">{customer.name}</span>
                   </div>
                </td>
                <td className="px-8 py-8 opacity-60 group-hover:opacity-100 transition-opacity lowercase">{customer.email}</td>
                <td className="px-8 py-8 opacity-60">
                   <div className="flex items-center gap-2">
                     <Building2 className="w-3.5 h-3.5 text-zinc-300" />
                     <span className="uppercase tracking-widest text-[11px] font-black">{customer.company || "Independent"}</span>
                   </div>
                </td>
                <td className="px-8 py-8">
                  <span className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-2",
                    customer.status === "Active" 
                      ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30" 
                      : "bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700"
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", customer.status === "Active" ? "bg-green-500 animate-pulse" : "bg-zinc-400")} />
                    {customer.status}
                  </span>
                </td>
                <td className="px-8 py-8 text-right">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#012169] dark:hover:bg-[#012169] dark:hover:text-white transition-all shadow-xl active:scale-95"
                  >
                    Analysis <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div className="text-center py-24 opacity-30 select-none">
            <Sparkles className="w-16 h-16 mx-auto mb-6 text-zinc-300" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Database Empty</p>
          </div>
        )}
      </div>

      {/* Mobile Card View - Shown on Smaller Screens */}
      <div className="md:hidden space-y-6">
         {customers.map((customer) => (
           <Link 
             key={customer.id} 
             href={`/customers/${customer.id}`}
             className="block bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[2rem] p-8 shadow-xl active:scale-[0.98] transition-all relative overflow-hidden shelf-shadow"
           >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
                  <UserCircle2 className="w-6 h-6" />
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                  customer.status === "Active" 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-zinc-50 text-zinc-400 border-zinc-200"
                )}>
                  {customer.status}
                </span>
              </div>
              
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-zinc-50 mb-2 truncate">
                {customer.name}
              </h3>
              
              <div className="space-y-2 mb-8">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                  <Mail className="w-3.5 h-3.5" /> {customer.email}
                </div>
                <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                  <Building2 className="w-3.5 h-3.5" /> {customer.company || "Independent"}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-zinc-50 dark:border-zinc-900">
                 <span className="text-[9px] font-black text-[#012169] uppercase tracking-widest">Open Analysis</span>
                 <ChevronRight className="w-5 h-5 text-zinc-300" />
              </div>
           </Link>
         ))}
         {customers.length === 0 && (
            <div className="text-center py-20 bg-white/50 dark:bg-zinc-900/50 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Awaiting Client Enrollment</p>
            </div>
         )}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
