"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, User, Shield, Ban, AlertTriangle, Key, CreditCard, Trash2, Loader2, Activity } from "lucide-react";
import Link from "next/link";
import {
  updateUserPasswordAction,
  updateUserRoleAction,
  updateUserStatusAction,
  updateUserSubscriptionAction,
  deleteUserAction,
} from "../../admin-actions";

interface OrgInfo {
  id: string;
  name: string;
  plan: string;
  seatLimit: number;
  subscriptionStatus: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
}

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  bannedAt: string | null;
  bannedBy: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  organizationId: string | null;
  memberProfile: { role: string; organization: OrgInfo } | null;
  ownedOrganization: OrgInfo | null;
  employeeProfile: { department: string | null; position: string | null; status: string } | null;
  activityLogs: ActivityLog[];
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [operating, setOperating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      const data = await res.json();
      setUser(data);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handlePasswordChange() {
    if (!newPassword || newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setOperating(true);
    const res = await updateUserPasswordAction(id, newPassword);
    if (res.error) toast.error(res.error); else { toast.success("Password changed"); setNewPassword(""); setConfirmPassword(""); }
    setOperating(false);
  }

  async function handleRoleChange(role: string) {
    setOperating(true);
    const res = await updateUserRoleAction(id, role);
    if (res.error) toast.error(res.error); else { toast.success(`Role changed to ${role}`); load(); }
    setOperating(false);
  }

  async function handleStatusChange(status: string) {
    setOperating(true);
    const res = await updateUserStatusAction(id, status);
    if (res.error) toast.error(res.error); else { toast.success(`Status changed to ${status}`); load(); }
    setOperating(false);
  }

  async function handlePlanChange(plan: string) {
    setOperating(true);
    const res = await updateUserSubscriptionAction(id, plan);
    if (res.error) toast.error(res.error); else { toast.success(`Plan changed to ${plan}`); load(); }
    setOperating(false);
  }

  async function handleDelete() {
    setOperating(true);
    const res = await deleteUserAction(id);
    if (res.error) toast.error(res.error); else { toast.success("User deleted"); window.location.href = "/admin/users"; }
    setOperating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#012169]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-zinc-500">User not found</p>
        <Link href="/admin/users" className="text-[#012169] font-bold text-sm mt-4 inline-block">&larr; Back to users</Link>
      </div>
    );
  }

  const org = user.ownedOrganization || user.memberProfile?.organization;
  const orgRole = user.memberProfile?.role;

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 py-8 sm:py-12 space-y-10">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-[#012169] transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Users
      </Link>

      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#012169] to-[#c8102e] flex items-center justify-center shadow-xl">
          <span className="text-2xl font-black text-white">{(user.name || user.email)[0].toUpperCase()}</span>
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">{user.name || "Unnamed"}</h1>
          <p className="text-zinc-500">{user.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              user.role === "ADMIN" ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-500"
            }`}>{user.role}</span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              user.status === "ACTIVE" ? "bg-green-100 text-green-700" :
              user.status === "BANNED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
            }`}>{user.status}</span>
            {user.isVerified && <span className="text-[10px] font-black uppercase text-green-500">Verified</span>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-[#012169]" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Change Password</h2>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
            <button
              onClick={handlePasswordChange}
              disabled={operating}
              className="px-6 py-3 rounded-xl bg-[#012169] text-white font-bold text-sm hover:bg-[#012169]/90 transition-all disabled:opacity-50"
            >
              {operating ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Update Password"}
            </button>
          </div>
        </div>

        <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#012169]" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Role</h2>
          </div>
          <p className="text-sm text-zinc-500">Current role: <span className="font-bold text-zinc-900 dark:text-zinc-50">{user.role}</span></p>
          <div className="flex gap-3">
            <button
              onClick={() => handleRoleChange("USER")}
              disabled={user.role === "USER" || operating}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                user.role === "USER" ? "bg-[#012169] text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200"
              } disabled:opacity-50`}
            >
              User
            </button>
            <button
              onClick={() => handleRoleChange("ADMIN")}
              disabled={user.role === "ADMIN" || operating}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                user.role === "ADMIN" ? "bg-amber-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200"
              } disabled:opacity-50`}
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <Ban className="w-5 h-5 text-[#012169]" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Account Status</h2>
        </div>
        <p className="text-sm text-zinc-500">
          Current: <span className="font-bold text-zinc-900 dark:text-zinc-50">{user.status}</span>
          {user.bannedAt && <> — Since {new Date(user.bannedAt).toLocaleDateString()}</>}
        </p>
        <div className="flex gap-3">
          {["ACTIVE", "SUSPENDED", "BANNED"].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={user.status === s || operating}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                user.status === s
                  ? s === "ACTIVE" ? "bg-green-500 text-white" :
                    s === "BANNED" ? "bg-[#c8102e] text-white" : "bg-amber-500 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200"
              } disabled:opacity-50`}
            >
              {s === "ACTIVE" ? "Active" : s === "BANNED" ? "Banned" : "Suspended"}
            </button>
          ))}
        </div>
      </div>

      {org && (
        <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-[#012169]" />
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Subscription</h2>
              <p className="text-sm text-zinc-400">{org.name} {orgRole && <>({orgRole})</>}</p>
            </div>
          </div>
          <p className="text-sm text-zinc-500">Current plan: <span className="font-bold text-zinc-900 dark:text-zinc-50 uppercase">{org.plan}</span> &middot; {org.seatLimit} seats &middot; Status: {org.subscriptionStatus}</p>
          <div className="flex gap-3 flex-wrap">
            {["free", "personal", "business", "enterprise"].map((p) => (
              <button
                key={p}
                onClick={() => handlePlanChange(p)}
                disabled={org.plan === p || operating}
                className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                  org.plan === p
                    ? "bg-[#012169] text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200"
                } disabled:opacity-50 capitalize`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {user.activityLogs.length > 0 && (
        <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-[#012169]" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Recent Activity</h2>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {user.activityLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <div className="w-2 h-2 rounded-full bg-[#012169] mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{log.action}</p>
                  {log.details && <p className="text-xs text-zinc-400 truncate">{log.details}</p>}
                  <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/30 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <Trash2 className="w-5 h-5 text-[#c8102e]" />
          <h2 className="text-lg font-bold text-[#c8102e]">Danger Zone</h2>
        </div>
        <p className="text-sm text-zinc-500">Permanently delete this user and all associated data. This cannot be undone.</p>
        {showDeleteConfirm ? (
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-[#c8102e]">Are you sure?</p>
            <button onClick={handleDelete} disabled={operating} className="px-5 py-2.5 rounded-xl bg-[#c8102e] text-white font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50">
              {operating ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Yes, Delete"}
            </button>
            <button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold text-sm hover:bg-zinc-200 transition-all">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setShowDeleteConfirm(true)} className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[#c8102e] font-bold text-sm hover:bg-red-50 transition-all">
            Delete User
          </button>
        )}
      </div>
    </div>
  );
}
