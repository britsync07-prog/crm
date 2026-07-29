# Design: Unhide Outreach Tab & Hide Customers Tab

This document outlines the design and changes required to unhide the Outreach tab and hide the Customers tab in the navigation menu.

## Purpose & Requirements
1. **Unhide Outreach**: Restore the Outreach menu link pointing to `/campaigns` back to the sidebar navigation.
2. **Hide Customers**: Remove the Customers menu link pointing to `/customers` from the sidebar navigation.

## Proposed Changes

### 1. Navigation Menu Updates
**File**: [Sidebar.tsx](file:///home/saimon/job/crm/CRMsaas/src/components/Sidebar.tsx)
- Re-import the `Send` icon from `lucide-react` if not already present.
- Remove `{ name: "Customers", href: "/customers", icon: Users }` from the `menuItems` array.
- Add `{ name: "Outreach", href: "/campaigns", icon: Send }` back to the `menuItems` array.

## Verification Strategy
- Check sidebar on desktop and mobile:
  1. "Outreach" must be visible.
  2. "Customers" must be hidden.
