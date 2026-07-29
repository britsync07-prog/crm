"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  UserPlus,
  Users2,
  Send,
  Settings,
  Zap,
  Landmark,
  CreditCard,
  Mail,
  Video,
  FileText,
  Calendar as CalendarIcon,
  Menu,
  X,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Unified Inbox", href: "/inbox", icon: Mail },
  { name: "Leads", href: "/leads", icon: UserPlus },
  { name: "Billing & Finance", href: "/billing", icon: CreditCard },
  { name: "Team Hub", href: "/team", icon: Users2, matchPrefix: true },
  { name: "Calls & Meetings", href: "/calls", icon: Video },
  { name: "Outreach", href: "/campaigns", icon: Send },
  { name: "Forms", href: "/forms", icon: FileText },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
  { name: "Automations", href: "/automations", icon: Zap },
];

const NavContent = ({ pathname, setIsOpen }: { pathname: string; setIsOpen: (val: boolean) => void }) => (
  <>
    <div className="p-8 flex items-center justify-between border-b border-blue-100/80 dark:border-blue-900/30">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-gradient-to-br from-[#012169] to-[#c8102e] rounded-2xl flex items-center justify-center shadow-xl">
          <Landmark className="w-6 h-6 text-white" />
        </div>
        <div>
 <h1 className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-zinc-50 leading-none">BritCRM</h1>
          <p className="text-[8px] font-black text-[#012169] dark:text-blue-300 uppercase tracking-[0.24em] mt-1">Built by BritSync</p>
        </div>
      </div>
      <button onClick={() => setIsOpen(false)} className="lg:hidden p-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-colors">
        <X className="w-5 h-5 text-slate-500" />
      </button>
    </div>

    <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto custom-scrollbar">
      {menuItems.map((item) => {
        const isActive = item.matchPrefix ? pathname.startsWith(item.href) : pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 border-2 border-transparent",
              isActive
                ? "bg-gradient-to-r from-blue-50 to-red-50 dark:from-blue-950/35 dark:to-red-950/25 border-blue-200 dark:border-blue-600/30 text-[#012169] dark:text-blue-200 font-black italic"
                : "hover:bg-blue-50/70 dark:hover:bg-blue-950/20 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-zinc-100 hover:border-blue-100 dark:hover:border-blue-900/30"
            )}
          >
            <div className="flex items-center gap-4">
              <item.icon className={cn("w-4.5 h-4.5 transition-colors", isActive ? "text-[#012169] dark:text-blue-300" : "group-hover:text-[#012169] dark:group-hover:text-blue-300")} />
              <span className="text-[11px] font-black uppercase tracking-wider">{item.name}</span>
            </div>
            {isActive && (
              <div className="w-1.5 h-1.5 bg-[#c8102e] rounded-full shadow-[0_0_10px_rgba(200,16,46,0.7)]" />
            )}
          </Link>
        );
      })}
    </nav>

    <div className="p-6 border-t border-blue-100/80 dark:border-blue-900/30 space-y-3">
      <div className="flex items-center gap-3 px-4 py-2 text-slate-400 dark:text-zinc-500">
        <Settings className="w-4 h-4" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em]">System Settings</span>
      </div>
      <div className="pl-4 space-y-1 border-l-2 border-blue-50/60 dark:border-blue-950/30 ml-6">
        <Link
          href="/settings/email"
          onClick={() => setIsOpen(false)}
          className={cn(
            "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider",
            pathname === "/settings/email"
             ? "text-[#012169] dark:text-blue-200 bg-blue-50/40 dark:bg-blue-950/20 font-black italic"
             : "text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
          )}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email Setup</span>
        </Link>
        <Link
          href="/settings/team"
          onClick={() => setIsOpen(false)}
          className={cn(
            "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider",
            pathname === "/settings/team"
             ? "text-[#012169] dark:text-blue-200 bg-blue-50/40 dark:bg-blue-950/20 font-black italic"
             : "text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
          )}
        >
          <UserCog className="w-3.5 h-3.5" />
          <span>Team</span>
        </Link>
        <Link
          href="/settings/billing"
          onClick={() => setIsOpen(false)}
          className={cn(
            "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider",
            pathname === "/settings/billing"
             ? "text-[#012169] dark:text-blue-200 bg-blue-50/40 dark:bg-blue-950/20 font-black italic"
             : "text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
          )}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Subscription</span>
        </Link>
      </div>
    </div>
  </>
);

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isMarketingRoute =
    pathname === "/landing" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/pricing" ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/f/") ||
    pathname.startsWith("/meet/") ||
    pathname.startsWith("/features/") ||
    pathname.startsWith("/solutions/") ||
    pathname.startsWith("/vision/") ||
    pathname.startsWith("/admin");

  if (isMarketingRoute) {
    return null;
  }

  return (
    <>
      {/* Mobile Top Header (Fixed) */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-blue-100/80 dark:border-blue-900/30 flex items-center justify-between px-6 z-[60] lg:hidden">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#012169] to-[#c8102e] rounded-xl flex items-center justify-center shadow-lg">
              <Landmark className="w-5 h-5 text-white" />
            </div>
 <span className="text-sm font-black italic tracking-tighter">BritCRM</span>
         </div>
         <button 
           onClick={() => setIsOpen(true)}
           className="w-11 h-11 bg-[#012169] rounded-xl flex items-center justify-center shadow-2xl active:scale-90 transition-all"
         >
           <Menu className="w-5 h-5 text-white" />
         </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar Content (Drawer) */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen w-[320px] bg-white dark:bg-slate-950 border-r-4 border-[#012169] z-[80] flex flex-col transition-transform duration-500 lg:hidden shadow-[40px_0_80px_rgba(1,33,105,0.2)]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <NavContent pathname={pathname} setIsOpen={setIsOpen} />
      </aside>

      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 bg-white/95 dark:bg-slate-950/90 border-r border-blue-100/80 dark:border-blue-900/30 flex-col z-40 transition-all duration-300 backdrop-blur-md">
        <NavContent pathname={pathname} setIsOpen={setIsOpen} />
      </aside>

      {/* Page Content Spacing - Responsive */}
      <div className="h-20 lg:hidden" /> {/* Top header spacer */}
      <div className="hidden lg:block w-72 flex-shrink-0" /> {/* Sidebar spacer */}
    </>
  );
}
