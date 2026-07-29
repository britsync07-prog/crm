import type { Client } from "@/lib/britledger/types";
import { listClients } from "@/lib/britledger/clients";
import { Users, Plus, Circle, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

export default async function ClientList(props: Props) {
  const sp = await props.searchParams;
  const search = sp.search;
  const page = parseInt(sp.page || "1");

  let clients: Client[] = [];
  let total = 0;
  let loadError = false;

  try {
    const res = await listClients({ page, page_size: 20, search: search || undefined });
    clients = res.data || [];
    total = res.total || 0;
  } catch (e) {
    loadError = true;
    if (process.env.NODE_ENV === "development") console.error("[Clients] Failed to load:", e);
  }

  if (loadError) {
    return (
      <div className="text-center py-24 space-y-4">
        <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
        <p className="text-zinc-500 font-medium italic">Could not load clients.</p>
        <p className="text-[10px] text-zinc-400 font-bold">BritLedger may be unavailable. Try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase italic tracking-tight">Billing Clients</h2>
          <p className="text-zinc-500 text-sm mt-1">{total} client{total !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/billing/clients/new"
          className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
        >
          <Plus className="w-4 h-4" /> New Client
        </Link>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-500">
            <tr>
              <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Name</th>
              <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Email</th>
              <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest">Company</th>
              <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-black text-zinc-700 dark:text-zinc-300">
                      {client.name?.[0] || "?"}
                    </div>
                    <span className="font-black text-zinc-900 dark:text-white">{client.name}</span>
                  </div>
                </td>
                <td className="px-8 py-5 font-bold text-zinc-500">{client.email || "—"}</td>
                <td className="px-8 py-5 font-bold text-zinc-500">{client.company_name || "—"}</td>
                <td className="px-8 py-5 text-right">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                    client.is_active
                      ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                      : "bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-500"
                  }`}>
                    <Circle className={`w-2 h-2 fill-current ${client.is_active ? "text-green-500" : "text-zinc-400"}`} />
                    {client.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <Users className="w-8 h-8 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-zinc-500 font-medium italic">No clients yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
