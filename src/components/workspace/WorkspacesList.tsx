"use client";

import {
    Layers, Plus, Settings2, Users, ArrowUpRight,
    Briefcase, Layout, Trash2, AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface WorkspaceItem {
    id: string;
    name: string;
    ownerId: string;
    userCount: number;
    projectCount: number;
    totalTasks: number;
    completedTasks: number;
}

interface Props {
    workspaces: WorkspaceItem[];
    currentUserId: string;
}

export default function WorkspacesList({ workspaces: initial, currentUserId }: Props) {
    const router = useRouter();
    const [workspaces, setWorkspaces] = useState(initial);
    const [deletingId, setDeletingId] = useState<string | null>(null);   // which modal is open
    const [loadingId, setLoadingId] = useState<string | null>(null);     // spinner

    const handleDelete = async (workspaceId: string) => {
        setLoadingId(workspaceId);
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
            if (res.ok) {
                setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
                setDeletingId(null);
                router.refresh();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 dark:border-white/5 pb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic flex items-center gap-3">
                        <Layers className="w-8 h-8 text-indigo-500" /> Command <span className="text-indigo-500 not-italic">Bridge</span>
                    </h1>
                    <p className="text-zinc-500 font-medium mt-1">Multi-tenant architectural oversight and resource orchestration.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/workspaces/new"
                        className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
                    >
                        <Plus className="w-4 h-4" /> New Workspace
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {workspaces.map((ws) => {
                    const velocity = ws.totalTasks > 0 ? (ws.completedTasks / ws.totalTasks) * 100 : 0;
                    const isOwner = ws.ownerId === currentUserId;

                    return (
                        <div key={ws.id} className="bg-white dark:bg-zinc-950 rounded-[48px] border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden group hover:border-indigo-500/30 transition-all flex flex-col">
                            <div className="p-8 space-y-6 flex-1">
                                <div className="flex justify-between items-start">
                                    <div className="w-14 h-14 rounded-[20px] bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                        <Layout className="w-7 h-7" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
                                            <Settings2 className="w-4 h-4" />
                                        </button>
                                        {isOwner && (
                                            <button
                                                onClick={() => setDeletingId(ws.id)}
                                                className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                                                title="Delete workspace"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">{ws.name}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mt-1">
                                        {isOwner ? "Owner" : "Member"} · Industrial Cluster
                                    </p>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                        <span>Operational Velocity</span>
                                        <span>{velocity.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)] transition-all duration-1000"
                                            style={{ width: `${velocity}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="p-4 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                                        <p className="text-[9px] font-black uppercase text-zinc-400 mb-1">Personnel</p>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-3 h-3 text-indigo-500" />
                                            <span className="text-sm font-black">{ws.userCount}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                                        <p className="text-[9px] font-black uppercase text-zinc-400 mb-1">Projects</p>
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-3 h-3 text-green-500" />
                                            <span className="text-sm font-black">{ws.projectCount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-zinc-50/50 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-white/5">
                                <Link href={`/workspaces/${ws.id}`} className="w-full py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                                    Access Terminal <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    );
                })}

                {workspaces.length === 0 && (
                    <div className="col-span-full py-32 text-center space-y-6 bg-white dark:bg-zinc-950 rounded-[48px] border-2 border-dashed border-zinc-200 dark:border-white/10 opacity-30">
                        <Layers className="w-12 h-12 mx-auto text-zinc-400" />
                        <div className="space-y-2">
                            <h3 className="text-xl font-black uppercase italic">No Active Clusters</h3>
                            <p className="text-sm font-medium">Your architectural grid is currently empty.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deletingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Delete Workspace?</h2>
                                <p className="text-sm text-zinc-500 mt-1">
                                    This will permanently delete <strong className="text-zinc-900 dark:text-zinc-100">{workspaces.find(w => w.id === deletingId)?.name}</strong> along with all its channels, messages, members, and projects. This action <strong>cannot be undone</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setDeletingId(null)}
                                disabled={!!loadingId}
                                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deletingId)}
                                disabled={!!loadingId}
                                className="px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl transition-colors flex items-center gap-2"
                            >
                                {loadingId ? (
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Delete Workspace
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
