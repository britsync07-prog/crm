import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmailAccountForm } from "@/components/EmailAccountForm";

export const dynamic = 'force-dynamic';

export default async function EmailSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/landing");

  const accounts = await prisma.emailAccount.findMany({
    where: { userId: session.id }
  });

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Email Accounts</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Configure your SMTP accounts for automated cold outreach.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <EmailAccountForm />
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold mb-4">Connected Mailboxes</h2>
            <div className="space-y-4">
              {accounts.map((acc) => (
                <div key={acc.id} className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {acc.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{acc.email}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">SMTP: {acc.host}:{acc.port}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400">SENT TODAY</p>
                      <p className="text-xs font-bold">{acc.sentToday} / {acc.dailyLimit}</p>
                    </div>
                    <div className={`h-2 w-2 rounded-full ${acc.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <p className="text-sm text-zinc-500 italic py-4 text-center">No accounts connected yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50/30 p-6 dark:border-orange-900/30 dark:bg-orange-950/20">
            <h3 className="text-sm font-bold text-orange-800 dark:text-orange-400 mb-2">Deliverability Checklist</h3>
            <ul className="text-xs space-y-2 text-orange-700 dark:text-orange-300">
              <li className="flex items-center gap-2">✅ SPF Record configured</li>
              <li className="flex items-center gap-2">✅ DKIM Signature verified</li>
              <li className="flex items-center gap-2">❌ DMARC Policy missing</li>
              <li className="flex items-center gap-2">⏳ Warm-up in progress (Day 2/14)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
