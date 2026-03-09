"use client";

import { logoutAction } from "@/app/auth-actions";
import { Bell, Search, User } from "lucide-react";
import { usePathname } from "next/navigation";

export default function TopNavbar({ session }: { session: any }) {
  const pathname = usePathname();

  // Define marketing/public route prefixes
  const isMarketingRoute = 
    pathname === "/landing" || 
    pathname === "/login" || 
    pathname === "/signup" || 
    pathname.startsWith("/features/") || 
    pathname.startsWith("/solutions/") || 
    pathname.startsWith("/vision/");

  // Hide TopNavbar on marketing routes
  if (isMarketingRoute) {
    return null;
  }

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1 text-zinc-900 dark:text-zinc-50">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            placeholder="Search leads, tasks, campaigns..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border-none text-xs focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
          <Bell className="w-5 h-5 text-zinc-500" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white dark:border-zinc-950"></span>
        </button>

        <div className="flex items-center gap-3 border-l border-zinc-200 dark:border-zinc-800 pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{session?.name || session?.email || "User"}</p>
            <p className="text-[10px] text-zinc-500 uppercase font-medium">{session?.role || "Member"}</p>
          </div>
          <div className="group relative">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold cursor-pointer overflow-hidden border-2 border-transparent group-hover:border-blue-600 transition-all">
              <User className="w-5 h-5" />
            </div>
            {/* Dropdown */}
            <div className="absolute right-0 top-12 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                <p className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-50">{session?.email}</p>
              </div>
              <button className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Profile Settings</button>
              <button className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Help & Support</button>
              <form action={logoutAction}>
                <button type="submit" className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors mt-2">Log out</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
