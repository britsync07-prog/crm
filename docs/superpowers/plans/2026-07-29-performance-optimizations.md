# Performance Optimizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve page navigation latency by ensuring SQLite runs in WAL mode, parallelizing billing page queries, and preventing slow network login requests when BritLedger credentials are missing.

**Architecture:** 
1. Update `src/lib/db.ts` to execute `PRAGMA journal_mode = WAL;` upon initialization.
2. Update `src/lib/britledger/client.ts` to fail fast when credentials are empty.
3. Update `src/app/billing/page.tsx` to fetch data in parallel using `Promise.allSettled`.

**Tech Stack:** Next.js, Prisma, SQLite, Axios, TypeScript

---

### Task 1: BritLedger Client Fail-Fast

**Files:**
- Modify: `src/lib/britledger/client.ts`

- [ ] **Step 1: Add credentials presence check to login function**
  Modify [client.ts](file:///home/saimon/job/crm/CRMsaas/src/lib/britledger/client.ts#L10) to fail immediately if `EMAIL` or `PASSWORD` is missing:
  
  ```typescript
  // Before
  async function login(): Promise<string> {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD,
    });
    const token: string = res.data.access_token;
    cachedToken = token;
    tokenExpiry = Date.now() + 25 * 60 * 1000;
    return token;
  }

  // After
  async function login(): Promise<string> {
    if (!EMAIL || !PASSWORD) {
      throw new Error("Missing BritLedger credentials (BRITLEDGER_EMAIL or BRITLEDGER_PASSWORD)");
    }
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD,
    });
    const token: string = res.data.access_token;
    cachedToken = token;
    tokenExpiry = Date.now() + 25 * 60 * 1000;
    return token;
  }
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add src/lib/britledger/client.ts
  git commit -m "perf: throw error immediately in britledger client when credentials are empty"
  ```

---

### Task 2: Parallelize Billing Dashboard Queries

**Files:**
- Modify: `src/app/billing/page.tsx`

- [ ] **Step 1: Replace sequential awaits with Promise.allSettled**
  Modify [page.tsx](file:///home/saimon/job/crm/CRMsaas/src/app/billing/page.tsx#L22-L44) to run the data fetches concurrently:
  
  ```typescript
  // Before
  try {
    const revRes = await getRevenueSummary(yearStart, todayStr);
    revenue = revRes.data;
  } catch (e) {
    revenueError = true;
    if (process.env.NODE_ENV === "development") console.error("[Billing] Revenue error:", e);
  }

  try {
    const invRes = await listInvoices({ page: 1, page_size: 10 });
    invoices = invRes.data || [];
  } catch (e) {
    invoicesError = true;
    if (process.env.NODE_ENV === "development") console.error("[Billing] Invoices error:", e);
  }

  try {
    const clRes = await listClients({ page: 1, page_size: 1 });
    clientsCount = clRes.total || 0;
  } catch (e) {
    clientsError = true;
    if (process.env.NODE_ENV === "development") console.error("[Billing] Clients error:", e);
  }

  // After
  const [revRes, invRes, clRes] = await Promise.allSettled([
    getRevenueSummary(yearStart, todayStr),
    listInvoices({ page: 1, page_size: 10 }),
    listClients({ page: 1, page_size: 1 })
  ]);

  if (revRes.status === "fulfilled") {
    revenue = revRes.value.data;
  } else {
    revenueError = true;
    if (process.env.NODE_ENV === "development") console.error("[Billing] Revenue error:", revRes.reason);
  }

  if (invRes.status === "fulfilled") {
    invoices = invRes.value.data || [];
  } else {
    invoicesError = true;
    if (process.env.NODE_ENV === "development") console.error("[Billing] Invoices error:", invRes.reason);
  }

  if (clRes.status === "fulfilled") {
    clientsCount = clRes.value.total || 0;
  } else {
    clientsError = true;
    if (process.env.NODE_ENV === "development") console.error("[Billing] Clients error:", clRes.reason);
  }
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add src/app/billing/page.tsx
  git commit -m "perf: parallelize billing dashboard queries using Promise.allSettled"
  ```

---

### Task 3: SQLite WAL Mode Check on Connection Initialization

**Files:**
- Modify: `src/lib/db.ts`

- [ ] **Step 1: Execute PRAGMA journal_mode = WAL on prisma client instantiation**
  Modify [db.ts](file:///home/saimon/job/crm/CRMsaas/src/lib/db.ts) to execute the raw database pragma on startup:
  
  ```typescript
  // Before
  import { PrismaClient } from "@prisma/client";
  import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

  const globalForPrisma = global as unknown as { prisma_v4: PrismaClient };

  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:prisma/dev.db" });

  export const prisma =
    globalForPrisma.prisma_v4 ||
    new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v4 = prisma;

  // After
  import { PrismaClient } from "@prisma/client";
  import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

  const globalForPrisma = global as unknown as { prisma_v4: PrismaClient };

  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:prisma/dev.db" });

  export const prisma =
    globalForPrisma.prisma_v4 ||
    new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v4 = prisma;

  // Ensure WAL mode is active
  prisma.$executeRawUnsafe("PRAGMA journal_mode = WAL;").catch((err) => {
    console.error("Failed to set WAL mode:", err);
  });
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add src/lib/db.ts
  git commit -m "perf: enforce sqlite WAL mode on prisma initialization"
  ```

---

### Task 4: Verification Build

- [ ] **Step 1: Run production build and linting**
  Ensure there are no compilation or typecheck issues introduced by the optimizations.
  Run: `npm run lint` and `npm run build`
