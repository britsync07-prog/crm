"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Send, Loader2, Eye, EyeOff, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { sendNewsletterAction } from "../admin-actions";

export default function AdminNewsletterPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required");
      return;
    }

    const confirmed = window.confirm("Send this newsletter to all active users?");
    if (!confirmed) return;

    setLoading(true);
    const res = await sendNewsletterAction(subject, body);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Newsletter sent!");
      setSubject("");
      setBody("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 py-8 sm:py-12 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#012169] flex items-center justify-center shadow-lg shadow-blue-900/20">
          <Mail className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Newsletter</h1>
          <p className="text-zinc-500 font-medium text-sm">Compose and send to all active users</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/admin/newsletter/history"
          className="text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-[#012169] transition-colors flex items-center gap-1"
        >
          <Clock className="w-3 h-3" /> View History
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Newsletter subject..."
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#012169] font-bold"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Body (HTML)</label>
              <button
                type="button"
                onClick={() => setPreview(!preview)}
                className="text-[10px] font-black uppercase tracking-wider text-[#012169] hover:underline flex items-center gap-1"
              >
                {preview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {preview ? "Edit" : "Preview"}
              </button>
            </div>
            {preview ? (
              <div
                className="w-full min-h-[300px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white p-4 text-sm prose prose-sm max-w-none overflow-auto"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            ) : (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="<p>Hi {{name}},</p><p>Your newsletter content here...</p>"
                rows={14}
                className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#012169] resize-y"
              />
            )}
          </div>

          <p className="text-xs text-zinc-400">
            Use <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-[#c8102e]">{`{{name}}`}</code> in your HTML to personalize with the recipient&apos;s name.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3.5 rounded-xl bg-[#012169] text-white font-bold text-sm hover:bg-[#012169]/90 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? "Sending..." : "Send Newsletter"}
        </button>
      </form>
    </div>
  );
}
