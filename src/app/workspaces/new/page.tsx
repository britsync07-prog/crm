"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewWorkspacePage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/workspaces", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Something went wrong.");
                return;
            }
            const workspace = await res.json();
            router.push(`/workspaces/${workspace.id}`);
        } catch {
            setError("Could not create workspace. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <div className="w-full max-w-lg">
                {/* Back link */}
                <Link
                    href="/workspaces"
                    className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Workspaces
                </Link>

                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black uppercase italic tracking-tight">New Workspace</h1>
                                <p className="text-blue-200 text-xs font-medium">Create a collaborative hub for your team</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                Workspace Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                autoFocus
                                placeholder="e.g. Marketing HQ, Design Studio…"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                maxLength={60}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-zinc-400 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                Description <span className="text-zinc-400 font-normal normal-case">(optional)</span>
                            </label>
                            <textarea
                                placeholder="What is this workspace for?"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-zinc-400 resize-none transition"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="pt-2 flex items-center gap-3">
                            <Link
                                href="/workspaces"
                                className="flex-1 py-3 text-sm font-bold text-center text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading || !name.trim()}
                                className="flex-1 py-3 text-sm font-black uppercase tracking-widest bg-[#012169] hover:bg-[#c8102e] disabled:opacity-50 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Creating…
                                    </>
                                ) : (
                                    <>
                                        <Layers className="w-4 h-4" /> Create Workspace
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-xs text-zinc-400 mt-6">
                    A <strong>#general</strong> channel will be created automatically.
                </p>
            </div>
        </div>
    );
}
