"use client";

import { useState } from "react";
import { X, Plus, Layers, Loader2, AlertCircle } from "lucide-react";
import { createCategoryAction } from "@/app/finder/actions";
import { toast } from "react-hot-toast";

export default function CreateCategoryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      await createCategoryAction(name.trim());
      toast.success(`Category "${name}" created!`);
      setName("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create category.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic">New Category</h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Organize your pipeline</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 block">Category Name</label>
            <input
              type="text"
              required
              autoFocus
              className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-zinc-900 dark:text-white"
              placeholder="e.g. Real Estate Agents, Tech Founders"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={!name.trim() || isCreating}
            className="w-full py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-[0.2em] hover:opacity-90 disabled:opacity-50 transition-all shadow-xl flex items-center justify-center gap-2"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isCreating ? "Creating..." : "Create Category"}
          </button>
        </form>
      </div>
    </div>
  );
}
