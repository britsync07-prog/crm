"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Mail,
  Menu,
  X,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Users", href: "/admin/users", icon: Users, matchPrefix: true },
  { name: "Newsletter", href: "/admin/newsletter", icon: Mail, matchPrefix: true },
];

const NavContent = ({ pathname, setIsOpen }: { pathname: string; setIsOpen: (val: boolean) => void }) => (
  <>
    <div className="p-8 flex items-center justify-between border-b border-red-100/80 dark:border-red-900/30">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-gradient-to-br from-[#c8102e] to-[#012169] rounded-2xl flex items-center justify-center shadow-xl">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-zinc-50 leading-none">Admin</h1>
          <p className="text-[8px] font-black text-[#c8102e] dark:text-red-300 uppercase tracking-[0.24em] mt-1">BritCRM Control</p>
        </div>
      </div>
      <button onClick={() => setIsOpen(false)} className="lg:hidden p-3 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors">
        <X className="w-5 h-5 text-slate-500" />
      </button>
    </div>

    <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto custom-scrollbar">
      {menuItems.map((item) => {
        const isActive = item.exact ? pathname === item.href : item.matchPrefix ? pathname.startsWith(item.href) : pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 border-2 border-transparent",
              isActive
                ? "bg-gradient-to-r from-red-50 to-blue-50 dark:from-red-950/35 dark:to-blue-950/25 border-red-200 dark:border-red-600/30 text-[#c8102e] dark:text-red-200 font-black italic"
                : "hover:bg-red-50/70 dark:hover:bg-red-950/20 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-zinc-100 hover:border-red-100 dark:hover:border-red-900/30"
            )}
          >
            <div className="flex items-center gap-4">
              <item.icon className={cn("w-4.5 h-4.5 transition-colors", isActive ? "text-[#c8102e] dark:text-red-300" : "group-hover:text-[#c8102e] dark:group-hover:text-red-300")} />
              <span className="text-[11px] font-black uppercase tracking-wider">{item.name}</span>
            </div>
            {isActive && (
              <div className="w-1.5 h-1.5 bg-[#012169] rounded-full shadow-[0_0_10px_rgba(1,33,105,0.7)]" />
            )}
          </Link>
        );
      })}
    </nav>

    <div className="p-6 border-t border-red-100/80 dark:border-red-900/30 space-y-4">
      <Link
        href="/"
        onClick={() => setIsOpen(false)}
        className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all border-2 border-transparent text-slate-600 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-slate-900"
      >
        <ArrowLeft className="w-4.5 h-4.5" />
        <span className="text-[11px] font-black uppercase tracking-wider">Back to App</span>
      </Link>
    </div>
  </>
);

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-red-100/80 dark:border-red-900/30 flex items-center justify-between px-6 z-[60] lg:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#c8102e] to-[#012169] rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-black italic tracking-tighter">Admin</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="w-11 h-11 bg-[#c8102e] rounded-xl flex items-center justify-center shadow-2xl active:scale-90 transition-all"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      </header>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-screen w-[320px] bg-white dark:bg-slate-950 border-r-4 border-[#c8102e] z-[80] flex flex-col transition-transform duration-500 lg:hidden shadow-[40px_0_80px_rgba(200,16,46,0.2)]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <NavContent pathname={pathname} setIsOpen={setIsOpen} />
      </aside>

      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 bg-white/95 dark:bg-slate-950/90 border-r border-red-100/80 dark:border-red-900/30 flex-col z-40 transition-all duration-300 backdrop-blur-md">
        <NavContent pathname={pathname} setIsOpen={setIsOpen} />
      </aside>

      <div className="h-20 lg:hidden" />
      <div className="hidden lg:block w-72 flex-shrink-0" />
    </>
  );
}
