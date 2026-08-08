import { requireAdmin } from "@/lib/admin-guard";
import { getSystemEmailProfilesAction } from "../admin-actions";
import { SystemEmailProfileForm } from "@/components/admin/SystemEmailProfileForm";
import { Mail, Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSystemEmailPage() {
  await requireAdmin();
  const profiles = await getSystemEmailProfilesAction();

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 sm:py-12 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#012169] flex items-center justify-center shadow-lg shadow-blue-900/20">
          <div className="relative">
            <Mail className="w-7 h-7 text-white" />
            <Settings className="w-3.5 h-3.5 text-white absolute -right-1.5 -bottom-1.5" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">System Email</h1>
          <p className="text-zinc-500 font-medium text-sm">Manage forgot-password SMTP and newsletter SMTP from admin.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {profiles.map((profile) => (
          <SystemEmailProfileForm key={profile.profile} profile={profile} />
        ))}
      </div>
    </div>
  );
}
