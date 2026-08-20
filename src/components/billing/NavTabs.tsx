"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Users, FileSignature, BarChart3 } from "lucide-react";

const tabs = [
  { name: "Overview", href: "/billing", icon: BarChart3 },
  { name: "Invoices", href: "/billing/invoices", icon: FileText },
  { name: "Clients", href: "/billing/clients", icon: Users },
  { name: "Quotations", href: "/billing/quotations", icon: FileSignature },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== "/billing" && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex shrink-0 items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isActive
                ? "bg-[#012169] text-white shadow-lg"
                : "hover:bg-zinc-100 dark:hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
