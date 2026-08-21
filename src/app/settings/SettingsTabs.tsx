"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Mail, Users, CreditCard, WalletCards } from "lucide-react";

export default function SettingsTabs() {
  const pathname = usePathname();

  const tabs = [
    { name: "Mailboxes", href: "/settings/email", icon: Mail },
    { name: "Team Hub", href: "/settings/team", icon: Users },
    { name: "MCP Agents", href: "/settings/mcp", icon: Bot },
    { name: "Subscription", href: "/settings/billing", icon: CreditCard },
    { name: "Payments", href: "/settings/payments", icon: WalletCards },
  ];

  return (
    <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 gap-8 pb-4">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`flex items-center gap-2 pb-4 -mb-4 font-black uppercase text-[10px] tracking-widest border-b-2 transition-all ${
              isActive
                ? "border-[#012169] text-[#012169] dark:border-blue-500 dark:text-blue-400"
                : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
