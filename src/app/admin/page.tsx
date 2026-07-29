import { requireAdmin } from "@/lib/admin-guard";
import { getAdminStatsAction } from "./admin-actions";
import { Shield, Users, Building2, Ban, AlertTriangle, LayoutDashboard } from "lucide-react";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const stats = await getAdminStatsAction();

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "from-[#012169] to-blue-600" },
    { label: "Organizations", value: stats.totalOrgs, icon: Building2, color: "from-purple-600 to-purple-800" },
    { label: "Active", value: stats.activeUsers, icon: Shield, color: "from-green-500 to-green-700" },
    { label: "Banned", value: stats.bannedUsers, icon: Ban, color: "from-[#c8102e] to-red-700" },
    { label: "Suspended", value: stats.suspendedUsers, icon: AlertTriangle, color: "from-amber-500 to-amber-700" },
  ];

  const plans = stats.planDistribution;

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 sm:py-12 space-y-10">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#012169] flex items-center justify-center shadow-lg shadow-blue-900/20">
          <LayoutDashboard className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Admin Dashboard</h1>
          <p className="text-zinc-500 font-medium text-sm">System overview and management</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="p-5 rounded-[20px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{card.value}</p>
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-6">Plan Distribution</h2>
          <div className="space-y-4">
            {[
              { label: "Free", value: plans.free, color: "bg-zinc-400" },
              { label: "Personal", value: plans.personal, color: "bg-blue-500" },
              { label: "Business", value: plans.business, color: "bg-purple-500" },
              { label: "Enterprise", value: plans.enterprise, color: "bg-amber-500" },
            ].map((p) => {
              const max = Math.max(plans.free, plans.personal, plans.business, plans.enterprise, 1);
              const pct = (p.value / max) * 100;
              return (
                <div key={p.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{p.label}</span>
                    <span className="text-zinc-500">{p.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div className={`h-full rounded-full ${p.color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-6">Recent Registrations</h2>
          <div className="space-y-3">
            {stats.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">{u.name || u.email}</p>
                  <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    u.role === "ADMIN" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                  }`}>
                    {u.role}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    u.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                    u.status === "BANNED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  }`}>
                    {u.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
