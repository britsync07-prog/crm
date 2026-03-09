import { createLead } from "@/app/actions";
import Link from "next/link";

export default function NewLeadPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/leads"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          ← Cancel
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">New Lead</h1>
      </div>

      <form action={createLead} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
              placeholder="e.g. jane@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="source" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Lead Source
            </label>
            <select
              id="source"
              name="source"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
            >
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Cold Call">Cold Call</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="company" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Company Name
            </label>
            <input
              id="company"
              name="company"
              type="text"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
              placeholder="e.g. Acme Corp"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="licenseType" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                License Type
              </label>
              <input
                id="licenseType"
                name="licenseType"
                type="text"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                placeholder="e.g. Commercial Broker"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="areaOfOperation" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Area of Operation
              </label>
              <input
                id="areaOfOperation"
                name="areaOfOperation"
                type="text"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                placeholder="e.g. Downtown NY"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="dealFocus" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Deal Focus
              </label>
              <input
                id="dealFocus"
                name="dealFocus"
                type="text"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                placeholder="e.g. Retail, Office"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="budgetRange" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Budget Range
              </label>
              <input
                id="budgetRange"
                name="budgetRange"
                type="text"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-50"
                placeholder="e.g. $1M - $5M"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 transition-colors dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Create Lead
          </button>
        </div>
      </form>
    </div>
  );
}
