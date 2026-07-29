"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Users, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsTabBar() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Email Setup",
      href: "/settings/email",
      icon: Mail,
    },
    {
      name: "Team Settings",
      href: "/settings/team",
      icon: Users,
    },
    {
      name: "Subscription",
      href: "/settings/billing",
      icon: CreditCard,
    },
  ];

  return (
    <div className="border-b border-zinc-200 dark:border-white/10 w-full bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex space-x-8 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 py-4 px-1 border-b-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap outline-none",
                  isActive
                    ? "border-[#012169] text-[#012169] dark:text-blue-200 dark:border-blue-200 font-black italic"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
