"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Trash2, 
  CheckSquare, 
  Square, 
  ChevronRight,
  Mail,
  Building2,
  Zap,
  Phone,
  Target,
  Download
} from "lucide-react";
import { bulkUpdateLeadStatusAction, deleteLeadsAction } from "@/app/finder/actions";
import { toast } from "react-hot-toast";
import LeadPageHeader from "./LeadPageHeader";
import { cn } from "@/lib/utils";

export default function LeadsPageClient({ 
  initialLeads, 
  categories, 
  activeCategoryId 
}: { 
  initialLeads: any[], 
  categories: any[], 
  activeCategoryId?: string 
}) {
  const getStatusClass = (status: string) => {
    if (status === "Qualified" || status === "Converted") {
      return "bg-green-50 text-green-700 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30 shadow-lg shadow-green-500/10";
    }
    if (status === "Meeting Booked" || status === "Inbound Client") {
      return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 shadow-lg shadow-amber-500/10";
    }
    if (status === "Contacted" || status === "New") {
      return "bg-blue-50 text-[#012169] border-blue-100 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/30 shadow-lg shadow-blue-900/10";
    }
    return "bg-zinc-50 text-zinc-400 border-zinc-100 opacity-60";
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("Contacted");
  const router = useRouter();

  const LEAD_ROLE_OPTIONS = [
    "New",
    "Contacted",
    "Inbound Client",
    "Meeting Booked",
    "Qualified",
    "Converted",
  ];

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
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} leads permanently?`)) return;

    setIsDeleting(true);
    try {
      await deleteLeadsAction(selectedIds);
      toast.success(`${selectedIds.length} records purged`);
      setSelectedIds([]);
    } catch {
      toast.error("Operation failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.length === 0) return;
    setIsUpdatingStatus(true);
    try {
      const result = await bulkUpdateLeadStatusAction(selectedIds, bulkStatus);
      toast.success(`${result.updated} leads moved to "${bulkStatus}"`);
      setSelectedIds([]);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update lead role");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDownloadSelected = () => {
    if (selectedIds.length === 0) return;
    const selectedLeads = initialLeads.filter((lead) => selectedIds.includes(lead.id));

    const headers = ["Name", "Email", "Phone", "Company", "Category", "Role", "Source", "AI Score", "Created At"];
    const rows = selectedLeads.map((lead) =>
      [
        lead.name || "",
        lead.email || "",
        lead.phone || "",
        lead.company || "",
        lead.category?.name || "",
        lead.status || "",
        lead.source || "",
        String(lead.aiScore ?? 0),
        lead.createdAt ? new Date(lead.createdAt).toISOString() : "",
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-selected-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${selectedLeads.length} leads`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10 sm:space-y-14 animate-in fade-in duration-700 pb-32">
      <LeadPageHeader categories={categories} activeCategoryId={activeCategoryId} />

      {/* Bulk Actions Bar - Fixed to Bottom on Mobile for Reachability */}
      {selectedIds.length > 0 && (
        <div className="fixed top-20 sm:top-24 right-3 sm:right-6 w-[calc(100%-1.5rem)] sm:w-auto sm:min-w-[760px] max-w-5xl bg-zinc-900 border-2 border-blue-600 p-4 sm:p-6 rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] z-50 flex flex-col xl:flex-row xl:items-center gap-4 xl:justify-between animate-in slide-in-from-top-5 duration-300">
          <div className="flex items-center gap-3 sm:gap-5 pl-4 sm:pl-6">
            <div className="w-2.5 h-2.5 bg-[#012169] rounded-full animate-pulse" />
            <span className="text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">{selectedIds.length} Targets Focused</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={handleDownloadSelected}
              className="flex items-center gap-2 bg-white text-zinc-900 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>

            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="bg-zinc-800 text-white border border-zinc-700 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest"
            >
              {LEAD_ROLE_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <button
              onClick={handleBulkStatusUpdate}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 bg-[#012169] text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95"
            >
              {isUpdatingStatus ? "Updating..." : "Change Role"}
            </button>

            <button 
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden xl:block overflow-hidden rounded-[3rem] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-900 dark:bg-zinc-950 shelf-shadow border-b-[8px]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/50 text-zinc-400 dark:border-zinc-900 dark:bg-zinc-900/30">
            <tr>
              <th className="px-8 py-8 w-14">
                <button onClick={toggleSelectAll} className="text-zinc-300 hover:text-[#012169] transition-colors">
                  {selectedIds.length === initialLeads.length && initialLeads.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-[#012169]" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.3em]">Identification</th>
              <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.3em]">Sector</th>
              <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.3em]">Channels</th>
              <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-[#012169] text-center">AI Velocity</th>
              <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-right">Protocol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900 text-zinc-900 dark:text-zinc-100 italic font-medium">
            {initialLeads.map((lead) => (
              <tr key={lead.id} className={cn("hover:bg-blue-50/30 dark:hover:bg-[#012169]/5 transition-all group", selectedIds.includes(lead.id) ? 'bg-blue-50 border-l-4 border-l-blue-600' : '')}>
                <td className="px-8 py-10">
                  <button onClick={() => toggleSelect(lead.id)} className="text-zinc-200 group-hover:text-zinc-400 transition-colors">
                    {selectedIds.includes(lead.id) ? (
                      <CheckSquare className="w-5 h-5 text-[#012169]" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </td>
                <td className="px-8 py-10">
                  <div className="flex flex-col gap-1">
                    <Link href={`/leads/${lead.id}`} className="font-black text-xl hover:text-[#012169] transition-all uppercase italic tracking-tighter leading-none">
                      {lead.name}
                    </Link>
                    <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                       <Building2 className="w-3 h-3" />
                       <span className="text-[10px] font-black uppercase tracking-widest leading-none">{lead.company || "INDIVIDUAL"}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-10">
                  {lead.category ? (
                    <span className="inline-flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-[10px] font-black text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 uppercase tracking-widest shadow-inner">
                      {lead.category.name}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-300 italic font-black uppercase tracking-widest opacity-30">NO SECTOR</span>
                  )}
                </td>
                <td className="px-8 py-10">
                  <div className="flex flex-col gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 text-[11px] font-black tracking-tight"><Mail className="w-3.5 h-3.5 text-[#012169]" /> {lead.email}</div>
                    {lead.phone && <div className="flex items-center gap-2 text-[10px] font-bold"><Phone className="w-3.5 h-3.5 text-zinc-400" /> {lead.phone}</div>}
                  </div>
                </td>
                <td className="px-8 py-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden shadow-inner">
                      <div 
                        className={cn("h-full transition-all duration-1000", lead.aiScore > 70 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : lead.aiScore > 30 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]')} 
                        style={{ width: `${lead.aiScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-black italic tracking-tighter text-[#012169]">{lead.aiScore}% VELOCITY</span>
                  </div>
                </td>
                <td className="px-8 py-10 text-right">
                  <span className={cn("inline-flex items-center gap-2 rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] border-2",
                    getStatusClass(lead.status)
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", lead.status ? "bg-current animate-pulse" : "bg-zinc-300")} />
                    {lead.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {initialLeads.length === 0 && (
          <div className="text-center py-40 opacity-30 select-none">
            <Target className="w-20 h-20 mx-auto mb-10 text-zinc-300 animate-pulse" />
            <p className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400">Scan Pipeline: 0 Targets Found</p>
          </div>
        )}
      </div>

      {/* Mobile Card View - Hidden on Tablet+ */}
      <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-8">
         {initialLeads.map((lead) => (
           <div 
             key={lead.id} 
             className={cn(
               "relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[2.5rem] p-10 shadow-2xl transition-all shelf-shadow border-b-[6px]",
               selectedIds.includes(lead.id) ? "border-blue-600 ring-4 ring-blue-500/5 bg-blue-50/10" : "hover:border-blue-400/30"
             )}
           >
              <button 
                onClick={() => toggleSelect(lead.id)}
                className="absolute top-8 right-8 z-10 p-2 text-zinc-200"
              >
                {selectedIds.includes(lead.id) ? (
                  <CheckSquare className="w-7 h-7 text-[#012169]" />
                ) : (
                  <Square className="w-7 h-7" />
                )}
              </button>

              <div className="flex items-center gap-4 mb-8">
                 <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
                    <Target className="w-7 h-7" />
                 </div>
                 <span className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                   getStatusClass(lead.status)
                 )}>
                   {lead.status}
                 </span>
              </div>

              <div className="space-y-2 mb-8 pr-12">
                 <Link href={`/leads/${lead.id}`} className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-zinc-50 leading-none block hover:text-[#012169] transition-all">
                   {lead.name}
                 </Link>
                 <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                   <Building2 className="w-4 h-4" /> {lead.company || "INDIVIDUAL"}
                 </div>
              </div>

              <div className="space-y-4 mb-10 pb-8 border-b border-zinc-50 dark:border-zinc-900">
                 <div className="flex items-center gap-3 text-xs font-bold text-zinc-500 break-all leading-relaxed">
                   <Mail className="w-4 h-4 text-[#012169] shrink-0" /> {lead.email}
                 </div>
                 <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 dark:bg-zinc-900 w-fit rounded-xl">
                   <Zap className="w-4 h-4 text-[#012169]" />
                   <span className="text-[10px] font-black uppercase italic tracking-tighter">{lead.aiScore}% VELOCITY</span>
                 </div>
              </div>

              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                   <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">SECTOR ARCHIVE</p>
                   <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tighter">{lead.category?.name || "UNCATEGORIZED"}</p>
                 </div>
                 <Link href={`/leads/${lead.id}`} className="w-12 h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all">
                    <ChevronRight className="w-6 h-6" />
                 </Link>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
