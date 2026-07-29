# Platform Audit Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 86 issues found in the full platform audit — broken routes, dead buttons, empty catches, dead links, and unused imports.

**Architecture:** Fixes are organized by file/location rather than issue type. Each task modifies a single file (or a small group of closely related files) to keep commits focused and reviewable.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Prisma, Tailwind CSS

## Global Constraints

- No new dependencies
- All changes must be compile-safe (no dangling imports, no undefined vars)
- Keep existing code style and patterns

---

### Task 1: Sidebar — Fix `/settings` link & remove dead import

**Files:**
- Modify: `src/components/Sidebar.tsx:32,90`

- [ ] **Change `/settings` href to `/settings/email`**

- [ ] **Remove unused imports (`Layers`, `Share2`)**

---

### Task 2: Dashboard — Fix dead `/finder` link, wire check-circle button, clean imports

**Files:**
- Modify: `src/components/Dashboard.tsx:4-23,79,230`

- [ ] **Remove `/finder` link — replace with disabled button**
- [ ] **Wire check-circle button — mark task complete**
- [ ] **Remove 8 unused imports**

---

### Task 3: TopNavbar — Wire notification bell, profile settings, help & support

**Files:**
- Modify: `src/components/TopNavbar.tsx:39,59,60`

- [ ] **Wire notification bell — dropdown log**
- [ ] **Wire Profile Settings — link to `/settings/email`**
- [ ] **Wire Help & Support — mailto link**

---

### Task 4: Landing Page — Fix Product Tour button, footer links, clean imports

**Files:**
- Modify: `src/app/landing/page.tsx:104,770-771,787-790,796-798`, imports

- [ ] **Wire Product Tour button — smooth scroll to features**
- [ ] **Fix social links — real URLs**
- [ ] **Fix Resources links — external URLs**
- [ ] **Fix Legal links — external URLs**
- [ ] **Remove 6 unused imports**

---

### Task 5: Social Page — Remove broken links, wire buttons, clean imports

**Files:**
- Modify: `src/app/social/page.tsx:52-58,77,109,138`

- [ ] **Remove Create Post link (no `/social/new` route)**
- [ ] **Wire Generate Drafts button**
- [ ] **Wire ThumbsUp button**
- [ ] **Remove Connect link (no `/social/connect` route)**
- [ ] **Remove 4 unused imports**

---

### Task 6: Team Page — Wire department filters & employee More button, clean imports

**Files:**
- Modify: `src/app/team/page.tsx:110,130`, imports

- [ ] **Wire department filter buttons**
- [ ] **Wire employee More button**
- [ ] **Remove 6 unused imports**

---

### Task 7: Inbox — Wire star toggles, More button

**Files:**
- Modify: `src/components/inbox/InboxClient.tsx:427,549,601`

- [ ] **Wire star/favorite toggle in email detail**
- [ ] **Wire star/favorite toggle in thread list**
- [ ] **Wire More button in toolbar**

---

### Task 8: Automations Page — Wire Settings & Delete buttons

**Files:**
- Modify: `src/app/automations/page.tsx:88,91`

- [ ] **Wire Settings gear button**
- [ ] **Wire Delete button with confirmation**

---

### Task 9: Features & Portal — Wire remaining dead buttons

**Files:**
- Modify: `src/app/features/ai-discovery/page.tsx:213`
- Modify: `src/app/portal/page.tsx:52`
- Modify: `src/app/onboarding/page.tsx:110`
- Modify: `src/components/workspace/WorkspacesList.tsx:81`

- [ ] **Wire "Launch ICP Lab" button**
- [ ] **Wire "Open Support" button**
- [ ] **Wire "Take Over" button**
- [ ] **Wire Settings gear on workspace cards**

---

### Task 10: Customer & Lead Pages — Remove `/deals/new` dead links

**Files:**
- Modify: `src/app/customers/[id]/page.tsx:214`
- Modify: `src/app/leads/[id]/page.tsx:249`

- [ ] **Change `/deals/new` links to `/leads` or remove**

---

### Task 11: Empty Catch Blocks — Add error handling

**Files:**
- Modify: `src/components/billing/ClientSelect.tsx:29`
- Modify: `src/components/billing/InvoiceForm.tsx:78`
- Modify: `src/lib/google-maps-scraper.ts:177`
- Modify: `src/lib/imap.ts:130,186,234,263,315`

- [ ] **Add `console.error` to ClientSelect empty catch**
- [ ] **Add `console.error` to InvoiceForm empty catch**
- [ ] **Add `console.error` to google-maps-scraper empty catch**
- [ ] **Add `console.warn` to 5 imap.ts empty catches**

---

### Task 12: Empty Directories — Clean up stubs

**Files:**
- Delete: `src/app/deals/`
- Delete: `src/app/finder/`
- Delete: `src/app/tasks/`

- [ ] **Delete empty directories: `deals/`, `finder/`, `tasks/`**
