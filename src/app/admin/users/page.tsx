"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, Search, Loader2, Shield, Ban, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  bannedAt: string | null;
  createdAt: string;
  organizationId: string | null;
  memberProfile: { organization: { name: string; plan: string } } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?query=${encodeURIComponent(q)}&page=${p}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load(query, page);
    });
  }, [query, page, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "BANNED": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "SUSPENDED": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      default: return "bg-zinc-100 text-zinc-500";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 sm:py-12 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#012169] flex items-center justify-center shadow-lg shadow-blue-900/20">
          <Users className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Users</h1>
          <p className="text-zinc-500 font-medium text-sm">{total} total users</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search by name or email..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169] shadow-sm"
        />
      </form>

      <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
        {error ? (
          <div className="py-20 text-center text-red-500 font-medium">{error}</div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#012169]" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-zinc-400 font-medium">No users found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    {["User", "Email", "Role", "Status", "Organization", "Joined", ""].map((h) => (
                      <th key={h} className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#012169]/10 flex items-center justify-center">
                            <span className="text-sm font-black text-[#012169]">{(u.name || u.email)[0].toUpperCase()}</span>
                          </div>
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{u.name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          u.role === "ADMIN" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${statusBadge(u.status)}`}>{u.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{u.memberProfile?.organization?.name || "—"}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="text-[10px] font-black uppercase tracking-wider text-[#012169] hover:text-[#c8102e] transition-colors"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-400">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
