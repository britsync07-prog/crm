"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, UserPlus, Copy, CheckCircle2, XCircle, Loader2, Trash2, Clock, Shield } from "lucide-react";

interface Member {
  id: string;
  email: string;
  role: string;
  status: string;
  inviteToken: string;
  name: string | null;
  invitedByName: string | null;
  joinedAt: string | null;
  lastActive: string | null;
}

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [seatLimit, setSeatLimit] = useState(1);
  const [plan, setPlan] = useState("free");
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/organization/members");
      const data = await res.json();
      setMembers(data.members ?? []);
      setSeatLimit(data.seatLimit ?? 1);
      setPlan(data.plan ?? "free");
      setMyRole(data.myRole ?? null);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount = members.filter((m) => m.status === "active").length;
  const isAdmin = myRole === "admin";

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteResult(null);
    try {
      const res = await fetch("/api/organization/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (data.inviteUrl) {
        setInviteResult(data.inviteUrl);
        setInviteEmail("");
        load();
      } else {
        setInviteResult(data.error || "Failed to create invite");
      }
    } catch {
      setInviteResult("Network error");
    }
    setInviting(false);
  }

  async function handleCopy(url: string, id: string) {
    await navigator.clipboard.writeText(url);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  async function handleRemove(id: string) {
    setRemoving(id);
    try {
      await fetch(`/api/organization/members/${id}`, { method: "DELETE" });
      load();
    } catch { }
    setRemoving(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#012169]" />
      </div>
    );
  }

  return (
    <div className="space-y-12 sm:space-y-16 max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#012169] flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Team</h1>
            <p className="text-zinc-500 font-medium text-sm">Manage your organization members</p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
            {activeCount} of {seatLimit} seats used
          </p>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            {plan === "free" ? "Free" : plan === "personal" ? "Personal" : plan === "business" ? "Business" : "Enterprise"}
          </span>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#012169] transition-all"
            style={{ width: `${Math.min((activeCount / seatLimit) * 100, 100)}%` }}
          />
        </div>
      </div>

      {isAdmin && activeCount < seatLimit && (
        <form onSubmit={handleInvite} className="p-8 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-[#012169]" />
            <h2 className="text-lg font-bold">Invite Member</h2>
          </div>
          <div className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
            <button
              type="submit"
              disabled={inviting}
              className="px-6 py-3 rounded-xl bg-[#012169] text-white font-bold text-sm hover:bg-[#012169]/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Invite
            </button>
          </div>
          {inviteResult && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <span className="text-xs font-mono text-[#012169] break-all flex-1">{inviteResult}</span>
              <button
                onClick={() => handleCopy(inviteResult, "result")}
                className="shrink-0 p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {copiedIndex === "result" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-500" />}
              </button>
            </div>
          )}
        </form>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-3">
          <Users className="w-5 h-5 text-[#012169]" /> Members ({members.length})
        </h2>

        <div className="space-y-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-6 rounded-[20px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#012169]/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-[#012169]">
                    {(m.name || m.email)[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{m.name || m.email}</p>
                  {m.name && <p className="text-xs text-zinc-400 truncate">{m.email}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    {m.role === "admin" && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    )}
                    {m.status === "pending" && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {m.status === "active" && m.role !== "admin" && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-green-600">Member</span>
                    )}
                    {m.joinedAt && (
                      <span className="text-[10px] text-zinc-400">
                        Joined {new Date(m.joinedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {m.status === "pending" && isAdmin && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 font-mono max-w-[120px] truncate">
                      {m.inviteToken}
                    </span>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/invite/${m.inviteToken}`;
                        handleCopy(url, m.id);
                      }}
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Copy invite link"
                    >
                      {copiedIndex === m.id ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>
                  </div>
                )}
                {isAdmin && m.role !== "admin" && (
                  <button
                    onClick={() => handleRemove(m.id)}
                    disabled={removing === m.id}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-zinc-400 hover:text-red-500"
                    title="Remove member"
                  >
                    {removing === m.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="p-12 text-center text-zinc-400 font-medium border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[24px]">
              No members yet. Invite your first teammate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
