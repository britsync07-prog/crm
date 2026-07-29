# Hide Outreach & Redirect Dashboard to Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the Outreach tab and Dashboard from the sidebar navigation, redirect the root path `/` and all authenticated redirect flows to `/billing`, and keep the dashboard codebase intact but unused.

**Architecture:** Update the client-side navigation menu array to exclude Outreach and Dashboard, rewrite the root route page file to redirect authenticated users to the billing route, and update auth action redirection and middleware configuration to default authenticated users to `/billing` instead of `/`.

**Tech Stack:** Next.js (App Router), TypeScript, Lucide Icons

---

### Task 1: Navigation Menu Updates

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Remove Dashboard and Outreach menu items from the sidebar navigation array**
  Modify the `menuItems` array in `src/components/Sidebar.tsx` around line 26 to remove the Dashboard and Outreach links.
  
  ```typescript
  // Before
  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Unified Inbox", href: "/inbox", icon: Mail },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Leads", href: "/leads", icon: UserPlus },
    { name: "Billing & Finance", href: "/billing", icon: CreditCard },
    { name: "Team Hub", href: "/team", icon: Users2, matchPrefix: true },
    { name: "Calls & Meetings", href: "/calls", icon: Video },
    { name: "Outreach", href: "/campaigns", icon: Send },
    { name: "Forms", href: "/forms", icon: FileText },
    { name: "Calendar", href: "/calendar", icon: CalendarIcon },
    { name: "Automations", href: "/automations", icon: Zap },
  ];

  // After
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
  ```

- [ ] **Step 2: Commit changes**
  Run command:
  ```bash
  git add src/components/Sidebar.tsx
  git commit -m "feat: hide outreach and dashboard from sidebar navigation menuItems"
  ```

---

### Task 2: Root Page Route Redirection

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update page.tsx to redirect to billing page**
  Remove the `Dashboard` component import and replace rendering of `<Dashboard />` with a `redirect("/billing")`.
  
  ```typescript
  // Before
  import { getSession } from "@/lib/auth";
  import Dashboard from "@/components/Dashboard";
  import { redirect } from "next/navigation";

  export default async function Home() {
    const session = await getSession();

    if (!session) {
      redirect("/landing");
    }

    return <Dashboard />;
  }

  // After
  import { getSession } from "@/lib/auth";
  import { redirect } from "next/navigation";

  export default async function Home() {
    const session = await getSession();

    if (!session) {
      redirect("/landing");
    }

    redirect("/billing");
  }
  ```

- [ ] **Step 2: Commit changes**
  Run command:
  ```bash
  git add src/app/page.tsx
  git commit -m "feat: redirect root page route to billing for authenticated users"
  ```

---

### Task 3: Authentication Actions Redirection

**Files:**
- Modify: `src/app/auth-actions.ts`

- [ ] **Step 1: Update loginAction and signupAction successful redirect path**
  Replace `redirect("/")` with `redirect("/billing")` in `loginAction` (around line 40) and `signupAction` (around line 132).
  
  ```typescript
  // Before (in loginAction)
  redirect("/");

  // After (in loginAction)
  redirect("/billing");
  ```
  
  ```typescript
  // Before (in signupAction)
  redirect("/");

  // After (in signupAction)
  redirect("/billing");
  ```

- [ ] **Step 2: Commit changes**
  Run command:
  ```bash
  git add src/app/auth-actions.ts
  git commit -m "feat: update login and signup actions to redirect to billing"
  ```

---

### Task 4: Middleware Redirection

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Update authenticated redirect target when accessing public routes**
  In `src/middleware.ts` (around line 35), change the redirect URL from `/` to `/billing` for users who are already logged in but trying to access public pages (except landing).
  
  ```typescript
  // Before
  if (
    isPublicRoute &&
    session &&
    path !== "/landing"
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // After
  if (
    isPublicRoute &&
    session &&
    path !== "/landing"
  ) {
    return NextResponse.redirect(new URL("/billing", req.nextUrl));
  }
  ```

- [ ] **Step 2: Commit changes**
  Run command:
  ```bash
  git add src/middleware.ts
  git commit -m "feat: update middleware public-page-redirection to point to billing"
  ```

---

### Task 5: Compilation and Lint Check

- [ ] **Step 1: Run typecheck and linting**
  Ensure there are no compilation or style errors introduced by these routing updates.
  Run: `npm run lint`
  Expected: Command runs successfully with no errors or warnings.
  
- [ ] **Step 2: Run Next.js production build**
  Ensure that Next.js builds successfully.
  Run: `npm run build`
  Expected: Build finishes with exit code 0.
