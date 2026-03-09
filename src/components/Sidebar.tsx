"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Search,
  CheckSquare,
  Users2,
  PhoneCall,
  Send,
  Settings,
  Zap,
  ChevronRight,
  Sparkles,
  Briefcase,
  CreditCard,
  Layers,
  Mail,
  Share2,
  Video
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Unified Inbox", href: "/inbox", icon: Mail },
  { name: "Pipeline", href: "/deals", icon: Briefcase },
  { name: "Workspaces", href: "/workspaces", icon: Layers },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Leads", href: "/leads", icon: UserPlus },
  { name: "Lead Finder", href: "/finder", icon: Search },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Omni Social", href: "/social", icon: Share2 },
  { name: "Billing & Finance", href: "/billing", icon: CreditCard },
  { name: "Team Hub", href: "/team", icon: Users2 },
  { name: "Onboarding", href: "/onboarding", icon: UserPlus },
  { name: "Calls & Meetings", href: "/calls", icon: Video },
  { name: "Outreach", href: "/campaigns", icon: Send },
  { name: "Automations", href: "/automations", icon: Zap },
];

export default function Sidebar() {
  const pathname = usePathname();

  // Define marketing/public route prefixes
  const isMarketingRoute =
    pathname === "/landing" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/features/") ||
    pathname.startsWith("/solutions/") ||
    pathname.startsWith("/vision/");

  // Hide sidebar on marketing routes
  if (isMarketingRoute) {
    return null;
  }

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex-col z-40">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-50 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white dark:text-black" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">MiniCRM</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white font-semibold"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-zinc-900 dark:text-white" : "group-hover:text-zinc-900 dark:group-hover:text-zinc-100")} />
                  <span className="text-sm">{item.name}</span>
                </div>
                {isActive && <div className="w-1 h-4 bg-zinc-900 dark:bg-zinc-50 rounded-full" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Spacer for content area on desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  );
}
