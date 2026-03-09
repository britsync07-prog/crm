"use client";

import { useState } from "react";
import { Plus, Upload, Download, Layers, Filter, Trash2 } from "lucide-react";
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
    if (!confirm("Are you sure you want to delete this category? Leads will not be deleted, only uncategorized.")) return;

    setIsDeletingCat(true);
    try {
      await deleteCategoryAction(activeCategoryId);
      toast.success("Category deleted");
      router.push("/leads");
    } catch (e) {
      toast.error("Failed to delete category");
    } finally {
      setIsDeletingCat(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row md:items-center gap-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic">Leads <span className="text-indigo-500 not-italic">&</span> Pipeline</h1>
            <p className="text-zinc-500 font-medium">Your active front-line sales prospects.</p>
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <select
                value={activeCategoryId || ""}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 cursor-pointer min-w-[150px]"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            {activeCategoryId && (
              <button 
                onClick={handleDeleteCategory}
                disabled={isDeletingCat}
                className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-2xl hover:bg-red-100 transition-all disabled:opacity-50"
                title="Delete this category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCategoryOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-white/5 transition-all shadow-sm"
          >
            <Layers className="w-4 h-4 text-indigo-500" /> New Category
          </button>
          <button 
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-white/5 transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <Link
            href="/leads/new"
            className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> New Prospect
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
