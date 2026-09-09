"use client";

import React, { useState } from "react";
import { Shield, Check, X, AlertCircle } from "lucide-react";
import { updateAIPermissionAction } from "@/app/onboarding/actions";

interface PermissionItem {
  id: string;
  actionKey: string;
  actionName: string;
  aiAllowed: boolean;
  humanApprovalRequired: boolean;
  description?: string | null;
}

interface AIPermissionMatrixEditorProps {
  initialPermissions: PermissionItem[];
}

export default function AIPermissionMatrixEditor({
  initialPermissions,
}: AIPermissionMatrixEditorProps) {
  const [permissions, setPermissions] = useState<PermissionItem[]>(initialPermissions);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const handleToggle = async (
    item: PermissionItem,
    field: "aiAllowed" | "humanApprovalRequired"
  ) => {
    const updatedAiAllowed = field === "aiAllowed" ? !item.aiAllowed : item.aiAllowed;
    const updatedApproval = field === "humanApprovalRequired" ? !item.humanApprovalRequired : item.humanApprovalRequired;

    setUpdatingKey(item.actionKey);
    try {
      const res = await updateAIPermissionAction(item.actionKey, updatedAiAllowed, updatedApproval);
      if (res.success) {
        setPermissions((prev) =>
          prev.map((p) =>
            p.actionKey === item.actionKey
              ? { ...p, aiAllowed: updatedAiAllowed, humanApprovalRequired: updatedApproval }
              : p
          )
        );
        setNotification(`Updated "${item.actionName}" permission.`);
        setTimeout(() => setNotification(null), 3000);
      }
    } finally {
      setUpdatingKey(null);
    }
  };

  return (
    <div className="space-y-4 bg-white dark:bg-zinc-900/60 p-6 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#012169] dark:text-blue-400">
            Safety & Governance Architecture (Section 24)
          </span>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#012169] dark:text-blue-400" />
            AI Permission & Approval Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configurable governance matrix controlling AI autonomous preparation vs mandatory human approval gates.
          </p>
        </div>
        {notification && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200">
            {notification}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">AI Allowed</th>
              <th className="py-3 px-4">Human Approval Required</th>
              <th className="py-3 px-4">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {permissions.map((item) => {
              const isUpdating = updatingKey === item.actionKey;
              return (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {item.actionName}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggle(item, "aiAllowed")}
                      disabled={isUpdating}
                      className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        item.aiAllowed
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-white/5"
                      }`}
                    >
                      {item.aiAllowed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      {item.aiAllowed ? "AI Active" : "AI Disabled"}
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggle(item, "humanApprovalRequired")}
                      disabled={isUpdating}
                      className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        item.humanApprovalRequired
                          ? "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-white/5"
                      }`}
                    >
                      {item.humanApprovalRequired ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      {item.humanApprovalRequired ? "Mandatory Approval" : "Autonomous / None"}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs">
                    {item.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
