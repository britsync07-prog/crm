# Design: Sidebar System Settings Nesting

This document outlines the design and changes required to group and nest the system settings sub-links (Email Setup, Team, and Subscription) under a unified "System Settings" header in the sidebar layout.

## Purpose & Requirements
1. **Unified Hierarchy**: Group separate footer links into a single, cohesive "System Settings" group.
2. **Indented Layout**: Render Email Setup, Team, and Subscription as indented child links with a vertical connecting line/border for clean visual structure.

## Proposed Changes

### 1. Sidebar Component Layout
**File**: [Sidebar.tsx](file:///home/saimon/job/crm/CRMsaas/src/components/Sidebar.tsx)
- Re-import the `Mail` icon if it is not already used/imported.
- Modify the footer container at the bottom of the sidebar to render a "System Settings" header and a list of indented child links (Email Setup, Team, Subscription).

## Verification Strategy
- Perform a Next.js production build and check for compilation issues.
- Check Sidebar visually to ensure the nested elements compile and display correctly.
