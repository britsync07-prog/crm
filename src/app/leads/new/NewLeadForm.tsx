"use client";

import { useState } from "react";
import { createLead } from "@/app/actions";
import { createCategoryAction } from "@/app/finder/actions";
import { Plus, Layers, Loader2, Check, X } from "lucide-react";
import { toast } from "react-hot-toast";

interface Category {
  id: string;
  name: string;
}

interface NewLeadFormProps {
  categories: Category[];
  defaultCategoryId?: string;
}

export default function NewLeadForm({ categories: initialCategories, defaultCategoryId }: NewLeadFormProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(defaultCategoryId || "");
  const [isCreatingSector, setIsCreatingSector] = useState(false);
  const [newSectorName, setNewSectorName] = useState("");
  const [isSubmittingSector, setIsSubmittingSector] = useState(false);

  const handleCreateSector = async (e: React.MouseEvent) => {
    e.preventDefault();
    const trimmed = newSectorName.trim();
    if (!trimmed) {
      toast.error("Please enter a sector name");
      return;
    }

    setIsSubmittingSector(true);
    try {
      const created = await createCategoryAction(trimmed);
      if (created) {
        // Add if not already in list
        if (!categories.some((c) => c.id === created.id)) {
          setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        }
        setSelectedCategoryId(created.id);
        toast.success(`Sector "${created.name}" created!`);
        setNewSectorName("");
        setIsCreatingSector(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create sector");
    } finally {
      setIsSubmittingSector(false);
    }
  };

  return (
    <form action={createLead} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
            placeholder="e.g. Jane Doe"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
            placeholder="e.g. jane@example.com"
          />
        </div>

        {/* Category / Sector Selection & On-the-fly Creation */}
        <div className="space-y-2 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40">
          <div className="flex items-center justify-between">
            <label htmlFor="categoryId" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#012169]" />
              Sector / Category
            </label>
            {!isCreatingSector && (
              <button
                type="button"
                onClick={() => setIsCreatingSector(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#012169] hover:underline dark:text-blue-400"
              >
                <Plus className="w-3.5 h-3.5" />
                New Sector
              </button>
            )}
          </div>

          <div className="space-y-3">
            <select
              id="categoryId"
              name="categoryId"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
            >
              <option value="">No Sector / Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Inline Sector Creation */}
            {isCreatingSector && (
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  <span>Create New Sector</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingSector(false);
                      setNewSectorName("");
                    }}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="newCategoryName"
                    value={newSectorName}
                    onChange={(e) => setNewSectorName(e.target.value)}
                    placeholder="e.g. Real Estate, Tech Startups"
                    className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateSector(e as any);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={isSubmittingSector || !newSectorName.trim()}
                    onClick={handleCreateSector}
                    className="rounded-lg bg-[#012169] px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-900 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmittingSector ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="source" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Lead Source
          </label>
          <select
            id="source"
            name="source"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
          >
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Cold Call">Cold Call</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="company" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Company Name
          </label>
          <input
            id="company"
            name="company"
            type="text"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
            placeholder="e.g. Acme Corp"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="licenseType" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              License Type
            </label>
            <input
              id="licenseType"
              name="licenseType"
              type="text"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
              placeholder="e.g. Commercial Broker"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="areaOfOperation" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Area of Operation
            </label>
            <input
              id="areaOfOperation"
              name="areaOfOperation"
              type="text"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
              placeholder="e.g. Downtown NY"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="dealFocus" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Deal Focus
            </label>
            <input
              id="dealFocus"
              name="dealFocus"
              type="text"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
              placeholder="e.g. Retail, Office"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="budgetRange" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Budget Range
            </label>
            <input
              id="budgetRange"
              name="budgetRange"
              type="text"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
              placeholder="e.g. $1M - $5M"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 transition-colors dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Create Lead
        </button>
      </div>
    </form>
  );
}
