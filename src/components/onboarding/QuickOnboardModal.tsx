"use client";

import React, { useState, useTransition } from "react";
import { startOnboardingForCustomerAction } from "@/app/onboarding/actions";
import { useRouter } from "next/navigation";
import { UserPlus, X, Sparkles } from "lucide-react";

interface CustomerOption {
  id: string;
  name: string;
  company: string | null;
  email: string;
}

interface QuickOnboardModalProps {
  customers: CustomerOption[];
}

const BLUEPRINTS = [
  "AI Automation Implementation",
  "Cybersecurity Advisory & Audit",
  "TalentBridge Recruitment SOW",
  "Management Consultancy",
  "Enterprise Training & Enablement",
  "Digital Product Engineering",
  "Custom Managed Service",
];

export default function QuickOnboardModal({ customers }: QuickOnboardModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const customerId = formData.get("customerId") as string;
    const serviceName = formData.get("serviceName") as string;
    const dealValue = Number(formData.get("dealValue")) || 10000;

    if (!customerId) {
      setError("Please select a client");
      return;
    }

    startTransition(async () => {
      const res = await startOnboardingForCustomerAction(customerId, serviceName, dealValue);
      if (res.success && res.onboardingId) {
        setIsOpen(false);
        router.push(`/onboarding/${res.onboardingId}`);
      } else {
        setError(res.error || "Failed to start onboarding");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 rounded-2xl bg-[#012169] hover:bg-[#c8102e] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2"
      >
        <UserPlus className="w-4 h-4" /> Onboard Client
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" /> Start Client Onboarding
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                  Select Client
                </label>
                <select
                  name="customerId"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose a Client --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company || c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                  Service Blueprint
                </label>
                <select
                  name="serviceName"
                  defaultValue="AI Automation Implementation"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BLUEPRINTS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                  Project Value (£)
                </label>
                <input
                  type="number"
                  name="dealValue"
                  defaultValue={10000}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  {isPending ? "Starting..." : "Launch Onboarding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
