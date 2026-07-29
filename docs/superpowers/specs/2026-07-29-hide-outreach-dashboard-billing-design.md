# Design: Hide Outreach Tab & Redirect Dashboard to Billing

This document outlines the design and changes required to remove/hide the Outreach tab, remove the main Dashboard component from active routing, and make the Billing page the default authenticated landing page.

## Purpose & Requirements
1. **Hide Outreach Tab**: Remove the Outreach menu link from the sidebar so users cannot navigate to it.
2. **Remove Dashboard**: Stop rendering the dashboard component. Make it completely inaccessible.
3. **Billing as Home Page**:
   - The root URL `/` redirects authenticated users to `/billing`.
   - Logging in or signing up redirects users to `/billing`.
   - Visiting public pages while authenticated redirects users to `/billing`.
4. **Code Preservation**: Keep `Dashboard.tsx` in the repository but render-inactive.

## Proposed Changes

### 1. Navigation Menu Updates
**File**: [Sidebar.tsx](file:///home/saimon/job/crm/CRMsaas/src/components/Sidebar.tsx)
- Remove `{ name: "Dashboard", href: "/", icon: LayoutDashboard }` from the `menuItems` array.
- Remove `{ name: "Outreach", href: "/campaigns", icon: Send }` from the `menuItems` array.

### 2. Root Page Route `/` Redirection
**File**: [page.tsx](file:///home/saimon/job/crm/CRMsaas/src/app/page.tsx)
- Remove `import Dashboard from "@/components/Dashboard";`.
- Replace `return <Dashboard />;` with `redirect("/billing");`.

### 3. Auth Actions Redirects
**File**: [auth-actions.ts](file:///home/saimon/job/crm/CRMsaas/src/app/auth-actions.ts)
- Modify successful redirects in `loginAction` and `signupAction` from `redirect("/");` to `redirect("/billing");`.

### 4. Middleware Session Redirection
**File**: [middleware.ts](file:///home/saimon/job/crm/CRMsaas/src/middleware.ts)
- In the public route check (step 5), redirect authenticated users to `/billing` instead of `/`.

## Verification Strategy
- **Manual Verification**:
  1. Access `/` as an unauthenticated user -> should redirect to `/landing`.
  2. Access `/login` as an unauthenticated user and perform login -> should redirect to `/billing`.
  3. Access `/` as an authenticated user -> should redirect to `/billing`.
  4. Access `/login` or `/signup` as an authenticated user -> should redirect to `/billing`.
  5. Check sidebar on desktop and mobile -> Dashboard and Outreach menu items must be hidden/removed.
