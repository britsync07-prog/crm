# Sidebar System Settings Nesting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Indent and nest the "Email Setup", "Team", and "Subscription" links under a single, non-clickable "System Settings" section in the sidebar.

**Architecture:**
- Modify `src/components/Sidebar.tsx` to group the three settings links in a structured, indented sub-navigation list. Ensure `Mail` is imported and used.

**Tech Stack:** Next.js, Tailwind CSS (or standard CSS styles defined in the project), Lucide Icons

---

### Task 1: Nest Sidebar Footer Links

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Check/update imports and modify footer nav layout**
  In [Sidebar.tsx](file:///home/saimon/job/crm/CRMsaas/src/components/Sidebar.tsx), ensure `Mail` is imported from `lucide-react`. Then replace the footer container with a unified "System Settings" header and nested list of links:
  
  ```typescript
  // Before (L83-L125 approx)
  <div className="p-6 border-t border-blue-100/80 dark:border-blue-900/30 space-y-4">
    <Link
      href="/settings/email"
      onClick={() => setIsOpen(false)}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all border-2 border-transparent",
        pathname.startsWith("/settings") 
         ? "bg-[#012169] text-white font-black italic border-[#012169]" 
         : "text-slate-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-slate-900"
      )}
    >
      <Settings className="w-4.5 h-4.5" />
      <span className="text-[11px] font-black uppercase tracking-wider">System Settings</span>
    </Link>
    <Link
      href="/settings/team"
      onClick={() => setIsOpen(false)}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all border-2 border-transparent",
        pathname === "/settings/team"
         ? "bg-[#012169] text-white font-black italic border-[#012169]"
         : "text-slate-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-slate-900"
      )}
    >
      <UserCog className="w-4.5 h-4.5" />
      <span className="text-[11px] font-black uppercase tracking-wider">Team</span>
    </Link>
    <Link
      href="/settings/billing"
      onClick={() => setIsOpen(false)}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all border-2 border-transparent",
        pathname === "/settings/billing"
         ? "bg-[#012169] text-white font-black italic border-[#012169]"
         : "text-slate-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-slate-900"
      )}
    >
      <CreditCard className="w-4.5 h-4.5" />
      <span className="text-[11px] font-black uppercase tracking-wider">Subscription</span>
    </Link>
  </div>

  // After
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
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add src/components/Sidebar.tsx
  git commit -m "feat: nest system settings, team, and subscription in sidebar footer"
  ```

---

### Task 2: Build Verification

- [ ] **Step 1: Verify production build compiles**
  Run: `npm run build`
