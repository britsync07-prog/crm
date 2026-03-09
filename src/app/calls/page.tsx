"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video, Plus, Clock, Copy, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

interface Meeting {
  id: string;
  meetingId: string;
  title: string;
  status: string;
  createdAt: string;
}

export default function CallsDashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Since we dropped the heavy GET /api/meetings endpoint for simplicity,
        // we'll fetch them from a new simple endpoint, or just inline a server action.
        // For now, let's create a tiny simple API endpoint for this.
        const res = await fetch("/api/meetings/list");
        if (res.ok) setMeetings(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || creating) return;
    setCreating(true);

    try {
      const res = await fetch("/api/meetings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewTitle("");
        // Reload list
        const listRes = await fetch("/api/meetings/list");
        if (listRes.ok) setMeetings(await listRes.json());
      }
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (meetingId: string) => {
    const url = `${window.location.origin}/meet/${meetingId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic flex items-center gap-3">
            <Video className="w-8 h-8 text-indigo-500" />
            Calls & Meetings
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Generate video meeting links for clients.</p>
        </div>
      </div>

      {/* Create Meeting Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl">
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            placeholder="e.g. Client Consultation: John Doe"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition"
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || creating}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-colors flex items-center shrink-0 gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Link
          </button>
        </form>
      </div>

      {/* Recent Meetings List */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Your Meetings
        </h2>

        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <Video className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No meetings created yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {meetings.map(m => (
              <div key={m.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate">{m.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 font-mono">
                    <span>ID: {m.meetingId}</span>
                    <span>·</span>
                    <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyLink(m.meetingId)}
                    className="p-2.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors"
                    title="Copy Link"
                  >
                    {copiedId === m.meetingId ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <Link
                    href={`/meet/${m.meetingId}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-bold rounded-xl transition-colors"
                  >
                    Join <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
