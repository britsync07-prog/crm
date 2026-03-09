import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createCampaign } from "@/app/campaign-actions";
import Link from "next/link";

export default async function NewCampaignPage() {
  const session = await getSession();
  if (!session) return;

  const emailAccounts = await prisma.emailAccount.findMany({
    where: { isActive: true, userId: session.id }
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/campaigns"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
        >
          ← Cancel
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Create AI Outreach Campaign</h1>
      </div>

      <form action={createCampaign} className="space-y-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500">CAMPAIGN NAME</label>
            <input
              name="name"
              required
              placeholder="e.g., Q1 Tech Outreach"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500">SENDER ACCOUNT</label>
            <select
              name="emailAccountId"
              required
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              {emailAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.email}</option>
              ))}
              {emailAccounts.length === 0 && <option disabled>No accounts found</option>}
            </select>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-950/20 space-y-6">
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-400 flex items-center gap-2">
            🤖 AI Content Generation
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500">TARGET AUDIENCE</label>
              <input
                name="audience"
                placeholder="e.g. Marketing Managers"
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500">INDUSTRY</label>
              <input
                name="industry"
                placeholder="e.g. Real Estate"
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500">YOUR OFFER / VALUE PROP</label>
            <textarea
              name="offer"
              rows={3}
              placeholder="Describe what you are selling or offering..."
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-8 py-2.5 text-sm font-medium text-zinc-50 hover:bg-zinc-800 transition-colors dark:bg-zinc-50 dark:text-zinc-950"
          >
            Launch Campaign
          </button>
        </div>
      </form>
    </div>
  );
}
