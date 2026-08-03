"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, User } from "lucide-react";
import type { Client } from "@/lib/britledger/types";
import { listClientsAction } from "@/app/billing/actions";

interface ClientSelectProps {
  value: string;
  onChange: (clientId: string, clientName: string) => void;
  onAddNew: () => void;
}

export default function ClientSelect({ value, onChange, onAddNew }: ClientSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedName = clients.find((c) => c.id === value)?.name || "";

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await listClientsAction({ page: 1, page_size: 50, search: search || undefined });
        if (res.success && res.data) {
          setClients(res.data);
        } else {
          console.error('Failed to load clients:', res.error);
        }
      } catch (err) { console.error('Failed to load clients:', err); }
      setLoading(false);
    }
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-900 dark:text-white"
      >
        {value ? selectedName || "Loading..." : "Select a client"}
        <ChevronDown className="w-4 h-4 text-zinc-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-xl overflow-hidden">
          <div className="p-3 border-b border-zinc-100 dark:border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#012169]"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading...</div>
            )}
            {!loading && clients.length === 0 && (
              <div className="p-4 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">No clients found</div>
            )}
            {clients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => {
                  onChange(client.id, client.name);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors ${value === client.id ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
              >
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-black shrink-0">
                  {client.name?.[0] || <User className="w-3 h-3" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{client.name}</p>
                  <p className="text-[10px] text-zinc-500">{client.email || client.company_name || "No contact"}</p>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => { onAddNew(); setOpen(false); }}
              className="w-full px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#012169] hover:bg-blue-50 dark:hover:bg-blue-950/20 border-t border-zinc-100 dark:border-white/5 transition-colors"
            >
              + Create New Client
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
