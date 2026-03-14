"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Clock, Copy, CheckCircle2, Loader2, ArrowRight, BarChart3, Trash2, Sparkles, Zap } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Form {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  _count: {
    submissions: number;
  };
}

export default function FormsDashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchForms = async () => {
    try {
      const res = await fetch("/api/forms");
      if (res.ok) setForms(await res.json());
    } catch (e) {
      console.error(e);
      toast.error("Failed to load forms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/f/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Public link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteForm = async (id: string) => {
    if (!confirm("Are you sure? This will delete all submissions too.")) return;
    try {
      const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
      if (res.ok) {
        setForms(forms.filter(f => f.id !== id));
        toast.success("Form deleted");
      }
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#012169]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16 pb-32">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 pb-4 border-b border-zinc-100 dark:border-zinc-900/50">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-[1.5rem] bg-[#012169] flex items-center justify-center shadow-2xl shadow-blue-900/20">
               <FileText className="w-7 h-7 text-white" />
             </div>
             <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-zinc-50 leading-none">
 BritCRM Forms
            </h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-1">Data Acquisition Engine • v4.02</p>
        </div>
        
        <Link
          href="/forms/new"
          className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-[1.5rem] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-blue-900/10 flex items-center justify-center gap-3 ring-2 ring-transparent hover:ring-blue-700/30"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Engine New Form
        </Link>
      </div>

      <div className="grid gap-8">
        {forms.length === 0 ? (
          <div className="text-center py-24 sm:py-40 bg-white dark:bg-zinc-950 border-[3px] border-dashed border-zinc-100 dark:border-zinc-900 rounded-[3rem] shadow-inner shelf-shadow">
            <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl">
               <Sparkles className="w-10 h-10 text-zinc-300 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black italic text-zinc-900 dark:text-white uppercase tracking-tighter">Zero Protocols Active</h3>
            <p className="text-zinc-400 font-bold mt-3 max-w-xs mx-auto text-sm uppercase tracking-tight">Deploy your first custom data acquisition gateway.</p>
            <Link href="/forms/new" className="mt-10 inline-flex items-center gap-2 text-[#012169] font-black uppercase tracking-widest text-xs hover:gap-4 transition-all">Start Construction <ArrowRight className="w-4 h-4" /></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {forms.map(f => (
              <div key={f.id} className="group relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[2.5rem] p-8 sm:p-10 transition-all hover:shadow-[0_40px_100px_rgba(0,0,0,0.1)] hover:-translate-y-2 border-b-[6px] border-b-zinc-100 dark:border-b-zinc-900 hover:border-b-blue-500">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 bg-zinc-50 dark:bg-[#012169]/10 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-[#012169] group-hover:text-white transition-all shadow-inner group-hover:rotate-6">
                    <Zap className="w-7 h-7" />
                  </div>
                  <button 
                    onClick={() => deleteForm(f.id)}
                    className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-10">
                   <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 italic uppercase tracking-tighter leading-none truncate">{f.title}</h3>
                   <p className="text-zinc-400 font-medium text-sm line-clamp-2 h-10 leading-relaxed">{f.description || "IDLE PROTOCOL: NO DESCRIPTION PROVIDED"}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[9px] font-black uppercase tracking-widest text-zinc-400 border-t border-zinc-50 dark:border-zinc-900 pt-8">
                  <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-xl">
                    <BarChart3 className="w-3.5 h-3.5 text-[#012169]" />
                    <span className="text-zinc-900 dark:text-zinc-100 tabular-nums">{f._count.submissions}</span> RECORDS
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    DEK: {new Date(f.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-10 flex flex-col xs:flex-row items-center gap-3">
                  <button
                    onClick={() => copyLink(f.id)}
                    className="w-full xs:flex-1 py-4 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 group/copy"
                  >
                    {copiedId === f.id ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 group-hover/copy:rotate-12" />}
                    GET LINK
                  </button>
                  <Link
                    href={`/forms/${f.id}/submissions`}
                    className="w-full xs:w-auto p-4 bg-[#012169] hover:bg-zinc-900 text-white rounded-2xl transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center group/btn"
                    title="View Analytics"
                  >
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
