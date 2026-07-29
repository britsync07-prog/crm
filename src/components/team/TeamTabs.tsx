"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users2, Layers } from "lucide-react";

const tabs = [
  { name: "Personnel", href: "/team", icon: Users2 },
  { name: "Workspaces", href: "/team/workspaces", icon: Layers },
];

export default function TeamTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== "/team" && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
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
