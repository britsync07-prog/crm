"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addEmailAccount } from "@/app/campaign-actions";

const initialState = { error: null as string | null, success: false };

export function EmailAccountForm() {
    const router = useRouter();
    const [state, formAction] = useActionState(addEmailAccount as any, initialState);

    useEffect(() => {
        if (state?.success) {
            // Trigger a full server re-render so the Connected Mailboxes list updates
            router.refresh();
        }
    }, [state, router]);

    return (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold mb-4">Add Account</h2>
            <form action={formAction} className="space-y-4">
                {state?.error && (
                    <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-lg text-center font-medium">
                        {state.error}
                    </div>
                )}
                {state?.success && (
                    <div className="p-3 text-sm bg-green-50 border border-green-200 text-green-700 rounded-lg text-center font-medium">
                        ✅ Account connected successfully!
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500">EMAIL ADDRESS</label>
                    <input name="email" required type="email" placeholder="name@company.com" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500">SMTP HOST</label>
                    <input name="host" required placeholder="smtp.gmail.com" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500">SMTP PORT</label>
                        <input name="port" required type="number" defaultValue="587" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500">ENCRYPTION</label>
                        <select name="encryption" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                            <option value="TLS">TLS</option>
                            <option value="SSL">SSL</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500">IMAP HOST</label>
                    <input name="imapHost" required placeholder="imap.gmail.com" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500">IMAP PORT</label>
                    <input name="imapPort" required type="number" defaultValue="993" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500">USERNAME</label>
                    <input name="username" required className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500">PASSWORD / APP KEY</label>
                    <input name="password" required type="password" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" />
                </div>
                <button type="submit" className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 transition-colors dark:bg-zinc-50 dark:text-zinc-950">
                    Connect Account
                </button>
            </form>
        </div>
    );
}

