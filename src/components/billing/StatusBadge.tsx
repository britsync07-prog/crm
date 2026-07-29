import { CheckCircle2, AlertCircle, Clock, XCircle, FileText } from "lucide-react";
import { normalizeStatus } from "@/lib/britledger/utils";

const statusConfig: Record<string, { icon: any; bg: string; text: string }> = {
  Paid: { icon: CheckCircle2, bg: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400", text: "Paid" },
  Sent: { icon: Clock, bg: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400", text: "Sent" },
  Overdue: { icon: AlertCircle, bg: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400", text: "Overdue" },
  Draft: { icon: FileText, bg: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-400", text: "Draft" },
  Cancelled: { icon: XCircle, bg: "bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-500", text: "Cancelled" },
  Accepted: { icon: CheckCircle2, bg: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400", text: "Accepted" },
  Expired: { icon: AlertCircle, bg: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", text: "Expired" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[normalizeStatus(status)] || statusConfig.Draft;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${config.bg}`}>
      <Icon className="w-3 h-3" />
      {config.text}
    </span>
  );
}
