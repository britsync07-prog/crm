import { useState, useEffect } from "react";
import { X, Upload, FileText, CheckCircle2, Loader2, AlertCircle, Layers } from "lucide-react";
import { importLeadsFromCSV } from "@/app/team-actions";
import { getCategoriesAction } from "@/app/finder/actions";

export default function ImportLeadsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  useEffect(() => {
    if (isOpen) {
      async function loadCategories() {
        const data = await getCategoriesAction();
        setCategories(data);
      }
      loadCategories();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("categoryId", selectedCategoryId);

    try {
      const result = await importLeadsFromCSV(formData);
      if (result.success) {
        onClose();
        setFile(null);
      } else {
        setError(result.error || "Failed to import leads.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to import leads. Ensure CSV format is correct.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
              <Upload className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic">Import Leads</h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Bulk CSV Ingestion</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-8 space-y-6">
          <div className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 block">Target Category</label>
              <select
                className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-zinc-900 dark:text-white text-xs"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                disabled={isUploading}
              >
                <option value="">No Category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>

            <div className="p-8 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-3xl text-center space-y-4 hover:border-[#012169]/50 transition-all cursor-pointer relative">
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-[#012169]" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{file ? file.name : "Select CSV File"}</p>
                <p className="text-xs text-zinc-500 mt-1">Expected: name, email, company, industry, website</p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          <div className="bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Import Requirements</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="w-3 h-3 text-green-500" /> UTF-8 Encoded CSV
              </li>
              <li className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="w-3 h-3 text-green-500" /> Unique Email addresses
              </li>
            </ul>
          </div>

          <button 
            type="submit"
            disabled={!file || isUploading}
            className="w-full py-4 rounded-2xl bg-[#012169] text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-[#c8102e] disabled:opacity-50 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? "Processing..." : "Start Import"}
          </button>
        </form>
      </div>
    </div>
  );
}
