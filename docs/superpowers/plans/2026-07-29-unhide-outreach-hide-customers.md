# Unhide Outreach & Hide Customers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the Outreach tab and hide the Customers tab in the sidebar navigation layout.

**Architecture:** Update `Sidebar.tsx` to add `Send` back to the imports, remove Customers from `menuItems`, and restore Outreach to `menuItems`.

**Tech Stack:** Next.js (App Router), TypeScript, Lucide Icons

---

### Task 1: Update Sidebar Navigation Tabs

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Re-add Send icon import and restore Outreach menu item, and remove Customers menu item**
  Modify [Sidebar.tsx](file:///home/saimon/job/crm/CRMsaas/src/components/Sidebar.tsx):
  - In `lucide-react` import list, make sure `Send` is imported. If `Users` is no longer used elsewhere, we can remove it (but let's check: `Users` is also used for `Users2` etc., let's keep it safe or remove only if unused).
  - In the `menuItems` array, remove the Customers item and restore the Outreach item.
  
  ```typescript
  // Before
  const menuItems = [
    { name: "Unified Inbox", href: "/inbox", icon: Mail },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Leads", href: "/leads", icon: UserPlus },
    { name: "Billing & Finance", href: "/billing", icon: CreditCard },
    { name: "Team Hub", href: "/team", icon: Users2, matchPrefix: true },
    { name: "Calls & Meetings", href: "/calls", icon: Video },
    { name: "Forms", href: "/forms", icon: FileText },
    { name: "Calendar", href: "/calendar", icon: CalendarIcon },
    { name: "Automations", href: "/automations", icon: Zap },
  ];

  // After
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
  ```

- [ ] **Step 2: Commit changes**
  Run command:
  ```bash
  git add src/components/Sidebar.tsx
  git commit -m "feat: restore outreach tab and hide customers tab from sidebar navigation"
  ```

---

### Task 2: Compile & Lint Verification

- [ ] **Step 1: Run typecheck and linting**
  Ensure there are no compilation or style errors introduced.
  Run: `npm run lint`
  
- [ ] **Step 2: Run Next.js production build**
  Ensure that Next.js builds successfully.
  Run: `npm run build`
