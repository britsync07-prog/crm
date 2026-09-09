"use client";

import React, { useState, useTransition } from "react";
import { createDealAction } from "@/app/actions";
import { Plus, X, Trophy } from "lucide-react";

interface CreateDealModalProps {
  customerId?: string;
  leadId?: string;
  defaultName?: string;
}

export default function CreateDealModal({ customerId, leadId, defaultName }: CreateDealModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (customerId) formData.set("customerId", customerId);
    if (leadId) formData.set("leadId", leadId);

    startTransition(async () => {
      const res = await createDealAction(formData);
      if (res.success) {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 tracking-widest cursor-pointer flex items-center gap-1"
      >
        <Plus className="w-3 h-3" /> Add Deal
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> New Deal
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                  Deal Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={defaultName ? `${defaultName} Implementation` : ""}
                  placeholder="e.g. AI Automation & Operations"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                    Value (£)
                  </label>
                  <input
                    type="number"
                    name="value"
                    required
                    defaultValue={10000}
                    placeholder="10000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                    Stage
                  </label>
                  <select
                    name="stage"
                    defaultValue="Won"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Won">Won (Triggers Onboarding)</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Discovery">Discovery</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-[#012169] hover:bg-blue-800 text-white rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Create Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
