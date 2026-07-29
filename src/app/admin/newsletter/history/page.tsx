import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { Mail, Clock, Users } from "lucide-react";

export default async function AdminNewsletterHistoryPage() {
  await requireAdmin();

  const newsletters = await prisma.newsletter.findMany({
    orderBy: { sentAt: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 py-8 sm:py-12 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#012169] flex items-center justify-center shadow-lg shadow-blue-900/20">
          <Clock className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Newsletter History</h1>
          <p className="text-zinc-500 font-medium text-sm">Previously sent newsletters</p>
        </div>
      </div>

      {newsletters.length === 0 ? (
        <div className="p-12 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm text-center">
          <Mail className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">No newsletters sent yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {newsletters.map((nl) => (
            <div key={nl.id} className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-bold text-zinc-900 dark:text-zinc-50 truncate">{nl.subject}</h2>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {nl.recipientCount} recipients
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {nl.sentAt ? new Date(nl.sentAt).toLocaleString() : "—"}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="text-sm text-zinc-500 line-clamp-3 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: nl.body.substring(0, 300) + (nl.body.length > 300 ? "..." : "") }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
