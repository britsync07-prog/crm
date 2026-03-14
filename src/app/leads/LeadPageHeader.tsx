"use client";

import { useState } from "react";
import { Plus, Upload, Download, Layers, Filter, Trash2, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImportLeadsModal from "@/components/ImportLeadsModal";
import CreateCategoryModal from "@/components/CreateCategoryModal";
import { deleteCategoryAction } from "@/app/finder/actions";
import { toast } from "react-hot-toast";

export default function LeadPageHeader({ categories, activeCategoryId }: { categories: any[], activeCategoryId?: string }) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isDeletingCat, setIsDeletingCat] = useState(false);
  const router = useRouter();

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(window.location.search);
    if (categoryId) {
      params.set("categoryId", categoryId);
    } else {
      params.delete("categoryId");
    }
    router.push(`/leads?${params.toString()}`);
  };

  const handleDeleteCategory = async () => {
    if (!activeCategoryId) return;
    if (!confirm("Are you sure? Leads will not be deleted, only uncategorized.")) return;

    setIsDeletingCat(true);
    try {
      await deleteCategoryAction(activeCategoryId);
      toast.success("Category archived");
      router.push("/leads");
    } catch (e) {
      toast.error("Process failed");
    } finally {
      setIsDeletingCat(false);
    }
  };

  return (
    <>
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 sm:gap-12 mb-10">
        <div className="flex flex-col lg:flex-row lg:items-end gap-10">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-[2rem] bg-[#012169] flex items-center justify-center shadow-2xl shadow-blue-900/20 shrink-0">
                 <Rocket className="w-8 h-8 text-white" />
               </div>
               <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter uppercase text-zinc-900 dark:text-zinc-50 leading-none">
                 Pipeline
               </h1>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 ml-1">Front-Line Acquisition Engine</p>
          </div>

          {/* Premium Filter Dropdown */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl sm:rounded-[2rem] px-6 py-4 flex-1 lg:flex-none lg:min-w-[280px] shadow-xl shadow-zinc-500/5 focus-within:border-blue-600 transition-all group">
              <Filter className="w-4 h-4 text-zinc-300 group-focus-within:text-[#012169] transition-colors" />
              <select
                value={activeCategoryId || ""}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 cursor-pointer w-full group-focus-within:translate-x-1 transition-transform"
              >
                <option value="">ALL GLOBAL SECTORS</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
            
            {activeCategoryId && (
              <button 
                onClick={handleDeleteCategory}
                disabled={isDeletingCat}
                className="p-5 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-[1.5rem] hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 shadow-lg shadow-red-500/10 active:scale-90"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Clusters - High Fidelity Responsiveness */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-2 sm:p-3 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 w-fit self-start xl:self-end">
          <button 
            onClick={() => setIsCategoryOpen(true)}
            className="flex items-center gap-3 rounded-2xl bg-white dark:bg-zinc-950 px-5 sm:px-8 py-3 sm:py-4 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all shadow-sm border border-zinc-100 dark:border-zinc-800"
          >
            <Layers className="w-4 h-4 text-[#012169]" /> <span className="hidden sm:inline">New Sector</span>
          </button>
          <button 
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-3 rounded-2xl bg-white dark:bg-zinc-950 px-5 sm:px-8 py-3 sm:py-4 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all shadow-sm border border-zinc-100 dark:border-zinc-800"
          >
            <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Import Batch</span>
          </button>
          <Link
            href="/leads/new"
            className="flex items-center gap-3 rounded-2xl bg-[#012169] px-6 sm:px-10 py-3 sm:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-zinc-900 transition-all shadow-2xl shadow-blue-900/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> <span className="sm:hidden">New</span><span className="hidden sm:inline">Launch New Prospect</span>
          </Link>
        </div>
      </div>

      <ImportLeadsModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
      />

      <CreateCategoryModal
        isOpen={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
      />
    </>
  );
}
