"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { createClientAction } from "@/app/billing/actions";

export default function NewClientPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    setError("");
    const result = await createClientAction({
      name,
      email: email || undefined,
      phone: phone || undefined,
      company_name: company || undefined,
      address: address || undefined,
    });
    setSaving(false);
    if (result.success) {
      router.push("/billing/clients");
    } else {
      setError(result.error || "Failed to create client");
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <Link href="/billing/clients" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#012169] transition-colors">
        <ArrowLeft className="w-3 h-3" /> Back to Clients
      </Link>

      <div>
        <h2 className="text-xl font-black uppercase italic tracking-tight">New Client</h2>
        <p className="text-zinc-500 text-sm mt-1">Add a new billing client.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm font-bold text-red-600">{error}</div>
        )}

        <div className="bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-sm p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]" placeholder="John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#012169]" placeholder="john@company.com" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#012169]" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Company Name</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#012169]" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#012169] resize-none" />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={!name || saving} className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl disabled:opacity-40">
            <User className="w-4 h-4" />
            {saving ? "Creating..." : "Create Client"}
          </button>
        </div>
      </form>
    </div>
  );
}
