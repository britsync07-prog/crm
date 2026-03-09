import { createAutomationFlow } from "@/app/automation-actions";
import Link from "next/link";

export default function NewAutomationPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/automations"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          ← Cancel
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Create Automation</h1>
      </div>

      <form action={createAutomationFlow} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500">WORKFLOW NAME</label>
            <input
              name="name"
              required
              placeholder="e.g., Welcome New Leads"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500">WHEN THIS HAPPENS (TRIGGER)</label>
              <select
                name="triggerType"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="LEAD_CREATED">Lead is Created</option>
                <option value="DEAL_CLOSED">Deal is Closed</option>
                <option value="TASK_COMPLETED">Task is Completed</option>
                <option value="CUSTOMER_CREATED">Customer is Created</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500">THEN DO THIS (ACTION)</label>
              <select
                name="actionType"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="CREATE_TASK">Create Onboarding Task</option>
                <option value="SEND_EMAIL">Send Welcome Email</option>
                <option value="CREATE_INVOICE">Generate Initial Invoice</option>
              </select>
              <input type="hidden" name="stepType" value="ACTION" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>Pro Tip:</strong> Visual builder is coming soon. For now, select a 1-step rapid automation.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 transition-colors dark:bg-zinc-50 dark:text-zinc-950"
          >
            Save Automation
          </button>
        </div>
      </form>
    </div>
  );
}
