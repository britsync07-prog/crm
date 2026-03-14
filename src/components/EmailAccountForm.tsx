"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addEmailAccount } from "@/app/campaign-actions";
import { Mail, Plus, Save } from "lucide-react";

const initialState = { error: null as string | null, success: false };

export function EmailAccountForm() {
    const router = useRouter();
    const [state, formAction] = useActionState(addEmailAccount as any, initialState);

    useEffect(() => {
        if (state?.success) {
            router.refresh();
        }
    }, [state, router]);

    return (
        <div className="rounded-[2rem] sm:rounded-[3rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-10 shadow-2xl relative overflow-hidden group/form">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover/form:rotate-12 transition-transform duration-700">
                <Mail className="w-24 h-24" />
            </div>
            
            <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#012169] flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
                    <Plus className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-0.5">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">Add Gateway</h2>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">SMTP & IMAP PROTOCOL</p>
                </div>
            </div>

            <form action={formAction} className="space-y-6 sm:space-y-8 relative z-10 max-h-[60vh] sm:max-h-none overflow-y-auto sm:overflow-visible pr-2 sm:pr-0 custom-scrollbar">
                {state?.error && (
                    <div className="p-4 text-xs bg-red-50 border border-red-200 text-red-600 rounded-2xl text-center font-black uppercase tracking-widest animate-in fade-in zoom-in-95 duration-300">
                        {state.error}
                    </div>
                )}
                {state?.success && (
                    <div className="p-4 text-xs bg-green-50 border border-green-200 text-green-700 rounded-2xl text-center font-black uppercase tracking-widest animate-in fade-in zoom-in-95 duration-300">
                        ✅ Gateway Connected
                    </div>
                )}

                <div className="space-y-6 sm:space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input name="email" required type="email" placeholder="NAME@COMPANY.COM" className="w-full rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-5 py-4 text-sm font-bold dark:text-white outline-none focus:border-blue-600 transition-all placeholder:text-zinc-300 uppercase shrink-0" />
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">SMTP Host</label>
                            <input name="host" required placeholder="SMTP.PROVIDER.COM" className="w-full rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-5 py-4 text-sm font-bold outline-none focus:border-blue-600 transition-all placeholder:text-zinc-300 uppercase" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Port</label>
                                <input name="port" required type="number" defaultValue="587" className="w-full rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-5 py-4 text-sm font-bold outline-none focus:border-blue-600 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">TLS/SSL</label>
                                <select name="encryption" className="w-full rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-5 py-4 text-sm font-bold outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer">
                                    <option value="TLS">TLS</option>
                                    <option value="SSL">SSL</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">IMAP Host</label>
                            <input name="imapHost" required placeholder="IMAP.PROVIDER.COM" className="w-full rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-5 py-4 text-sm font-bold outline-none focus:border-blue-600 transition-all placeholder:text-zinc-300 uppercase" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">IMAP Port</label>
                            <input name="imapPort" required type="number" defaultValue="993" className="w-full rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-5 py-4 text-sm font-bold outline-none focus:border-blue-600 transition-all" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Username</label>
                        <input name="username" required className="w-full rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-5 py-4 text-sm font-bold outline-none focus:border-blue-600 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">App Password</label>
                        <input name="password" required type="password" className="w-full rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-5 py-4 text-sm font-bold outline-none focus:border-blue-600 transition-all" />
                    </div>
                </div>

                <button type="submit" className="w-full rounded-2xl bg-zinc-900 dark:bg-white px-6 py-5 text-[10px] font-black text-zinc-50 dark:text-zinc-950 uppercase tracking-[0.3em] hover:bg-[#012169] hover:text-white dark:hover:bg-[#012169] dark:hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
                    <Save className="w-4 h-4" /> Link SMTP Gateway
                </button>
            </form>
        </div>
    );
}
