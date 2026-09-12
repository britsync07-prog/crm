"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Key,
  CreditCard,
  Trash2,
  Loader2,
  Activity,
  Shield,
  Ban,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
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
  subscriptionEndDate: string | null;
  createdAt?: string;
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
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [operating, setOperating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customDays, setCustomDays] = useState<number>(3);
  const [customDate, setCustomDate] = useState<string>("");

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load user");
      setUser(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load user");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function handlePasswordChange() {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setOperating(true);
    const res = await updateUserPasswordAction(id, newPassword);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Password changed");
      setNewPassword("");
      setConfirmPassword("");
    }
    setOperating(false);
  }

  async function handleRoleChange(role: string) {
    setOperating(true);
    const res = await updateUserRoleAction(id, role);
    if (res.error) toast.error(res.error);
    else {
      toast.success(`Role changed to ${role}`);
      load();
    }
    setOperating(false);
  }

  async function handleStatusChange(status: string) {
    setOperating(true);
    const res = await updateUserStatusAction(id, status);
    if (res.error) toast.error(res.error);
    else {
      toast.success(`Status changed to ${status}`);
      load();
    }
    setOperating(false);
  }

  async function handlePlanChange(plan: string) {
    setOperating(true);
    const res = await updateUserSubscriptionAction(id, { plan });
    if (res.error) toast.error(res.error);
    else {
      toast.success(`Plan updated to ${plan}`);
      load();
    }
    setOperating(false);
  }

  async function handleGrantTrial(days: number) {
    setOperating(true);
    const res = await updateUserSubscriptionAction(id, {
      trialDaysToAdd: days,
      subscriptionStatus: "trial",
    });
    if (res.error) toast.error(res.error);
    else {
      toast.success(`Granted +${days} days trial extension!`);
      load();
    }
    setOperating(false);
  }

  async function handleSetSubscriptionStatus(status: string) {
    setOperating(true);
    const res = await updateUserSubscriptionAction(id, { subscriptionStatus: status });
    if (res.error) toast.error(res.error);
    else {
      toast.success(`Subscription status set to ${status}`);
      load();
    }
    setOperating(false);
  }

  async function handleSetCustomDate() {
    if (!customDate) {
      toast.error("Please pick a valid date");
      return;
    }
    setOperating(true);
    const res = await updateUserSubscriptionAction(id, { customEndDate: customDate });
    if (res.error) toast.error(res.error);
    else {
      toast.success(`Expiration date updated to ${customDate}`);
      load();
    }
    setOperating(false);
  }

  async function handleDelete() {
    setOperating(true);
    const res = await deleteUserAction(id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("User deleted");
      router.push("/admin/users");
    }
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
        <p className={loadError ? "text-red-500" : "text-zinc-500"}>{loadError || "User not found"}</p>
        <Link href="/admin/users" className="text-[#012169] font-bold text-sm mt-4 inline-block">
          &larr; Back to users
        </Link>
      </div>
    );
  }

  const org = user.ownedOrganization || user.memberProfile?.organization;
  const orgRole = user.memberProfile?.role;

  // Compute trial countdown and expiration
  const now = Date.now();
  const subStatus = (org?.subscriptionStatus || "").toLowerCase();
  const endDate = org?.subscriptionEndDate ? new Date(org.subscriptionEndDate) : null;
  const msRemaining = endDate ? endDate.getTime() - now : 0;
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const isExpired =
    subStatus === "expired" ||
    subStatus === "canceled" ||
    (subStatus === "trial" && (endDate ? msRemaining <= 0 : true));

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 py-8 sm:py-12 space-y-10">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-[#012169] transition-colors"
      >
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
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                user.role === "ADMIN" ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {user.role}
            </span>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                user.status === "ACTIVE"
                  ? "bg-green-100 text-green-700"
                  : user.status === "BANNED"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {user.status}
            </span>
            {user.isVerified && <span className="text-[10px] font-black uppercase text-green-500">Verified</span>}
          </div>
        </div>
      </div>

      {/* Subscription & Trial Management Card */}
      {org && (
        <div className="p-8 rounded-[28px] bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/40 shadow-md space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#012169] flex items-center justify-center text-white shadow-lg">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Subscription & Trial Control</h2>
                <p className="text-sm text-zinc-400">
                  {org.name} {orgRole && <>({orgRole})</>}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-[#012169] text-white">
                Plan: {org.plan}
              </span>
              <span
                className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                  subStatus === "active"
                    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                    : isExpired
                    ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                }`}
              >
                {subStatus === "trial" ? (isExpired ? "Trial Expired" : `Trial (${daysRemaining}d left)`) : subStatus}
              </span>
            </div>
          </div>

          {/* Trial Status Summary */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/40">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Current Status</p>
              <p className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-1 capitalize">
                {subStatus} {isExpired && <span className="text-red-500 font-bold text-sm">(Expired)</span>}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/40">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Expiration Date</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {endDate ? endDate.toLocaleString() : "No expiry date set"}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/40">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Time Remaining</p>
              <p
                className={`text-lg font-black mt-1 ${
                  subStatus === "active" ? "text-green-600" : isExpired ? "text-red-500" : "text-blue-600"
                }`}
              >
                {subStatus === "active" ? "Active (Paid)" : isExpired ? "Expired" : `${daysRemaining} days remaining`}
              </p>
            </div>
          </div>

          {/* Section 1: Quick Grant / Extend Trial */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Grant or Extend Free Trial
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {[3, 7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => handleGrantTrial(days)}
                  disabled={operating}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-[#012169] text-white font-bold text-xs hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  <Clock className="w-3.5 h-3.5" />
                  +{days} Days Trial
                </button>
              ))}
            </div>

            {/* Custom Days Extender */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">Custom Days:</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={customDays}
                  onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-bold text-center"
                />
              </div>
              <button
                onClick={() => handleGrantTrial(customDays)}
                disabled={operating}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 transition-all disabled:opacity-50"
              >
                Grant {customDays} Days
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                />
                <button
                  onClick={handleSetCustomDate}
                  disabled={operating || !customDate}
                  className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-bold text-xs hover:bg-zinc-300 transition-all disabled:opacity-50"
                >
                  Set Expiry Date
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Change Pricing Plan */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Change Pricing Plan
            </h3>
            <div className="flex flex-wrap gap-3">
              {[
                { slug: "personal", label: "Personal (2 seats)", price: "$79/mo" },
                { slug: "business", label: "Business (5 seats)", price: "$149/mo" },
                { slug: "enterprise", label: "Enterprise (Unlimited)", price: "Custom" },
              ].map((p) => (
                <button
                  key={p.slug}
                  onClick={() => handlePlanChange(p.slug)}
                  disabled={org.plan === p.slug || operating}
                  className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                    org.plan === p.slug
                      ? "bg-[#012169] text-white shadow-md"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  } disabled:opacity-50`}
                >
                  {org.plan === p.slug && <CheckCircle className="w-3.5 h-3.5" />}
                  {p.label} · {p.price}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Change Status */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Set Subscription Status
            </h3>
            <div className="flex flex-wrap gap-3">
              {[
                { status: "active", label: "Active (Paid)", color: "bg-green-600" },
                { status: "trial", label: "Trial", color: "bg-blue-600" },
                { status: "expired", label: "Expired", color: "bg-red-600" },
                { status: "past_due", label: "Past Due", color: "bg-amber-600" },
                { status: "canceled", label: "Canceled", color: "bg-zinc-600" },
              ].map((s) => (
                <button
                  key={s.status}
                  onClick={() => handleSetSubscriptionStatus(s.status)}
                  disabled={subStatus === s.status || operating}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    subStatus === s.status
                      ? `${s.color} text-white shadow-sm`
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200"
                  } disabled:opacity-50`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Other Account Settings */}
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
          <p className="text-sm text-zinc-500">
            Current role: <span className="font-bold text-zinc-900 dark:text-zinc-50">{user.role}</span>
          </p>
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
                  ? s === "ACTIVE"
                    ? "bg-green-500 text-white"
                    : s === "BANNED"
                    ? "bg-[#c8102e] text-white"
                    : "bg-amber-500 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200"
              } disabled:opacity-50`}
            >
              {s === "ACTIVE" ? "Active" : s === "BANNED" ? "Banned" : "Suspended"}
            </button>
          ))}
        </div>
      </div>

      {user.activityLogs.length > 0 && (
        <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-[#012169]" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Recent Activity</h2>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {user.activityLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
              >
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
            <button
              onClick={handleDelete}
              disabled={operating}
              className="px-5 py-2.5 rounded-xl bg-[#c8102e] text-white font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {operating ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Yes, Delete"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold text-sm hover:bg-zinc-200 transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[#c8102e] font-bold text-sm hover:bg-red-50 transition-all"
          >
            Delete User
          </button>
        )}
      </div>
    </div>
  );
}
