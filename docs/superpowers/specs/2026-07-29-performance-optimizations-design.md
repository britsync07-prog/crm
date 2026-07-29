# Design: Performance Optimizations (SQLite WAL & BritLedger Fail-Fast)

This document outlines the performance optimizations required to resolve the 5-10 second latency issues when navigating pages.

## Purpose & Requirements
1. **SQLite WAL Mode**: Set the SQLite database to WAL mode so that writes do not block reads.
2. **BritLedger API Fail-Fast**: Ensure that missing credentials in the `.env` file fail immediately instead of initiating slow network requests.
3. **Concurreny on Billing Page**: Parallelize API fetches on the `/billing` page to fetch data concurrently.

## Proposed Changes

### 1. SQLite WAL Mode
We have already run the SQLite command to set `journal_mode = wal` on the `dev.db` file. We will add a startup check/initialization command to `src/lib/db.ts` to ensure WAL mode is kept active.

### 2. BritLedger API client
**File**: [client.ts](file:///home/saimon/job/crm/CRMsaas/src/lib/britledger/client.ts)
- In the `login()` function, check if `EMAIL` or `PASSWORD` are empty. If so, immediately throw an Error instead of sending an HTTP request.

### 3. Billing Dashboard Queries
**File**: [page.tsx](file:///home/saimon/job/crm/CRMsaas/src/app/billing/page.tsx)
- Replace sequential awaits with `Promise.allSettled` to execute fetches concurrently.

## Verification Strategy
- Measure response times for `/billing` page loads.
- Ensure that `npm run build` compiles successfully.
