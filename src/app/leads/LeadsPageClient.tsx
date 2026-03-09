"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Trash2, 
  CheckSquare, 
  Square, 
  AlertCircle,
  MoreVertical,
  ChevronDown
} from "lucide-react";
import { deleteLeadsAction } from "@/app/finder/actions";
import { toast } from "react-hot-toast";
import LeadPageHeader from "./LeadPageHeader";

export default function LeadsPageClient({ 
  initialLeads, 
  categories, 
  activeCategoryId 
}: { 
  initialLeads: any[], 
  categories: any[], 
  activeCategoryId?: string 
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === initialLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(initialLeads.map(l => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} leads?`)) return;

    setIsDeleting(true);
    try {
      await deleteLeadsAction(selectedIds);
      toast.success(`${selectedIds.length} leads deleted successfully`);
      setSelectedIds([]);
    } catch (e) {
      toast.error("Failed to delete leads");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <LeadPageHeader categories={categories} activeCategoryId={activeCategoryId} />

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-500/20 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <span className="text-white text-xs font-black uppercase tracking-widest">{selectedIds.length} leads selected</span>
          </div>
          <button 
            onClick={handleDeleteSelected}
            disabled={isDeleting}
            className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" />
            {isDeleting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/50 text-zinc-500 dark:border-white/5 dark:bg-white/5 dark:text-zinc-400">
            <tr>
              <th className="px-6 py-4 w-10">
                <button onClick={toggleSelectAll} className="text-zinc-400 hover:text-indigo-500 transition-colors">
                  {selectedIds.length === initialLeads.length && initialLeads.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest">Name & Company</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest">Category</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest">Contact Info</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest">Industry</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 text-center">AI Score</th>
              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-white/5 text-zinc-900 dark:text-zinc-100">
            {initialLeads.map((lead) => (
              <tr key={lead.id} className={`hover:bg-zinc-50 dark:hover:bg-white/5 group transition-colors ${selectedIds.includes(lead.id) ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}>
                <td className="px-6 py-4">
                  <button onClick={() => toggleSelect(lead.id)} className="text-zinc-300 group-hover:text-zinc-400 transition-colors">
                    {selectedIds.includes(lead.id) ? (
                      <CheckSquare className="w-4 h-4 text-indigo-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <Link href={`/leads/${lead.id}`} className="font-bold hover:text-indigo-600 transition-colors uppercase italic tracking-tighter">
                      {lead.name}
                    </Link>
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{lead.company || "Individual"}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {lead.category ? (
                    <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 text-[9px] font-black text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30 uppercase tracking-tighter">
                      {lead.category.name}
                    </span>
                  ) : (
                    <span className="text-[9px] text-zinc-400 italic font-bold uppercase tracking-widest opacity-50">Uncategorized</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">{lead.email}</span>
                    <span className="text-[10px] font-medium text-zinc-400">{lead.phone || "No Phone"}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black uppercase text-indigo-500 tracking-tighter">{lead.industry || "Unknown"}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 bg-zinc-100 dark:bg-white/5 rounded-full h-1 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${lead.aiScore > 70 ? 'bg-green-500' : lead.aiScore > 30 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                        style={{ width: `${lead.aiScore}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-black italic">{lead.aiScore}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                    lead.status === "Qualified" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    lead.status === "New" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : 
                    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}>
                    {lead.status}
                  </span>
                </td>
              </tr>
            ))}
            {initialLeads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-32 text-center space-y-6 opacity-30">
                  <div className="w-20 h-20 bg-zinc-100 dark:bg-white/5 rounded-[32px] flex items-center justify-center mx-auto">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                  <p className="text-zinc-500 font-black uppercase italic tracking-widest">No leads found in this sector.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
