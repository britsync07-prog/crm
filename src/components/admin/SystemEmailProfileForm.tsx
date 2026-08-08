"use client";

import { useActionState } from "react";
import { saveSystemEmailProfileAction, testSystemEmailProfileAction } from "@/app/admin/admin-actions";
import { Send, Save } from "lucide-react";

const initialState = { success: false, error: null as string | null };

type Profile = {
  profile: "transactional" | "newsletter";
  host: string;
  port: number;
  username: string;
  fromEmail: string;
  fromName: string;
  secureMode: string;
  isEnabled: boolean;
  hasPassword: boolean;
  envConfigured: boolean;
};

export function SystemEmailProfileForm({ profile }: { profile: Profile }) {
  const [saveState, saveAction, saving] = useActionState(saveSystemEmailProfileAction, initialState);
  const [testState, testAction, testing] = useActionState(testSystemEmailProfileAction, initialState);
  const title = profile.profile === "transactional" ? "Forgot Password SMTP" : "Newsletter SMTP";

  return (
    <div className="rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">{title}</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {profile.profile === "transactional" ? "Used by forgot password, welcome, and system emails." : "Used by admin newsletter broadcasts."}
          </p>
        </div>
        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
          profile.isEnabled ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
        }`}>
          {profile.isEnabled ? "Admin Managed" : profile.envConfigured ? "Env Fallback" : "Not Configured"}
        </span>
      </div>

      <form action={saveAction} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="profile" value={profile.profile} />
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">SMTP Host</span>
          <input name="host" defaultValue={profile.host} placeholder="smtp.example.com" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold" />
        </label>
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Port</span>
          <input name="port" type="number" defaultValue={profile.port} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold" />
        </label>
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Username</span>
          <input name="username" defaultValue={profile.username} placeholder="smtp_user" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold" />
        </label>
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Password</span>
          <input name="password" type="password" placeholder={profile.hasPassword ? "Leave blank to keep current password" : "Required"} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold" />
        </label>
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">From Email</span>
          <input name="fromEmail" type="email" defaultValue={profile.fromEmail} placeholder="noreply@example.com" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold" />
        </label>
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">From Name</span>
          <input name="fromName" defaultValue={profile.fromName} placeholder="BritCRM" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold" />
        </label>
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Security</span>
          <select name="secureMode" defaultValue={profile.secureMode} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold">
            <option value="STARTTLS">STARTTLS</option>
            <option value="SSL/TLS">SSL/TLS</option>
            <option value="NONE">None</option>
          </select>
        </label>
        <label className="flex items-center gap-3 pt-7">
          <input name="isEnabled" type="checkbox" defaultChecked={profile.isEnabled} className="w-4 h-4 rounded border-zinc-300 text-[#012169]" />
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Use this admin profile</span>
        </label>
        <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button disabled={saving} className="px-5 py-3 rounded-xl bg-[#012169] text-white text-[10px] font-black uppercase tracking-wider hover:bg-[#012169]/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving" : "Save SMTP"}
          </button>
          {(saveState.error || saveState.success) && (
            <span className={`text-xs font-bold ${saveState.error ? "text-red-600" : "text-green-600"}`}>
              {saveState.error || "SMTP profile saved."}
            </span>
          )}
        </div>
      </form>

      <form action={testAction} className="flex flex-col gap-3 sm:flex-row sm:items-end border-t border-zinc-100 dark:border-zinc-800 pt-5">
        <input type="hidden" name="profile" value={profile.profile} />
        <label className="space-y-2 flex-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Send Test To</span>
          <input name="to" type="email" placeholder="admin@example.com" className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold" />
        </label>
        <button disabled={testing} className="px-5 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
          <Send className="w-4 h-4" /> {testing ? "Testing" : "Send Test"}
        </button>
        {(testState.error || testState.success) && (
          <span className={`text-xs font-bold ${testState.error ? "text-red-600" : "text-green-600"}`}>
            {testState.error || "Test email sent."}
          </span>
        )}
      </form>
    </div>
  );
}
