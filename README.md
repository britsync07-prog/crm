# BritCRM
> A self-hosted Next.js CRM that unifies sales pipelines, real-time team chat, LiveKit video meetings, AI email outreach, and an MCP server for AI agents.

BritCRM is an all-in-one customer relationship platform for small teams and agencies: leads, customers, deals, invoicing, campaigns, meetings, and automations in one deployable Node process. It is designed to run on a single VPS with SQLite, expose its data to human users through a React App Router UI, and to AI agents through a first-party Model Context Protocol (MCP) server.

## Overview

The application consolidates what would otherwise be five SaaS subscriptions: a sales CRM (leads, customers, pipelines, deals), a billing module (clients, invoices, quotations synced to an external BritLedger bookkeeping service), an outreach engine (IMAP inbox sync, campaign sending, open/reply tracking), a meeting tool (self-hosted LiveKit rooms with virtual backgrounds and booking forms), and internal chat (Socket.io workspaces and channels). An admin area adds user/organization management, pricing plans, system SMTP, and newsletters.

Status: production-deployed on a VPS (`truecrm.online`, PM2-managed via `ecosystem.config.cjs`), with 14 Prisma migrations and roughly 55 models. Development has been fast and iterative; recent work focused on meeting-quality effects, MCP hardening, SEO surfaces, and billing alignment.

## Features

- Lead and customer management with categories, tags, pipelines, stages, and deals; bulk operations including multi-select deletion.
- Lead finder/scaper: Puppeteer- and Cheerio-driven scraping services with scrape jobs, logs, status polling, stop control, and downloadable result files.
- Email outreach: campaigns with per-campaign analytics, lead options, open tracking pixel, scheduled reply-checking worker, and inbound webhook ingestion.
- Unified inbox: IMAP account sync via `imapflow`/`mailparser`, batch email operations, and per-account settings.
- Team workspaces: Socket.io channels (public/private with role allowlists), presence lists, invites, custom roles, and nicknames - all authorized server-side per event.
- LiveKit video meetings: room creation, join tokens via server SDK, booking forms with availability checks, and browser-side virtual backgrounds with local MediaPipe segmentation assets.
- Calendar: events, reminders, settings, and a reminder worker loop; meeting scheduling ties into public forms.
- Billing: clients, invoices, quotations with direct line-item entry, plus BritLedger integration for bookkeeping, VAT, payments, and reports.
- Stripe monetization of the CRM itself: subscription checkout, customer portal, and signature-checked webhooks driven by admin-configured pricing plans/offers.
- Form builder with public submission endpoints and availability-aware meeting forms.
- Automation engine: workflow steps with execution logs and an admin operations dashboard.
- Newsletter management with subscribe/unsubscribe endpoints secured by a signing secret.
- MCP agent server: Streamable HTTP endpoint at `/api/mcp` (stdio for local dev) exposing resources and tools across mail, leads, outreach, forms, calendar, billing, and admin domains, authenticated by revocable per-user bearer tokens.
- Gemini-powered AI agents for lead enrichment and content tasks.
- Technical SEO and AI-discovery surfaces: metadata helpers, an `llms.txt` route, and feature/solution landing pages.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Custom server | Node.js HTTP server hosting Next, Socket.io 4, background workers, and LiveKit subprocess |
| Database | SQLite via Prisma 7 with the `@prisma/adapter-better-sqlite3` driver adapter |
| Realtime | Socket.io (JWT-authenticated handshake, workspace/channel rooms) |
| Video | Self-hosted LiveKit server v1.9.12 (`livekit-server-sdk`, `@livekit/components-react`, track processors for backgrounds) |
| Auth | bcrypt password hashing, jose JWT (HS256) in httpOnly cookies |
| Email | nodemailer (sending), imapflow + mailparser (inbox sync), handlebars-free template modules |
| Scraping | puppeteer, cheerio, node-html-parser |
| AI | @google/generative-ai (Gemini), @modelcontextprotocol/sdk |
| Payments | stripe SDK (checkout sessions, portal, webhooks) |
| Styling | Tailwind CSS 4, lucide-react icons, react-hot-toast |
| Ops | PM2 (`ecosystem.config.cjs`), tsx for scripts, ESLint 9 |

## Architecture

- **Single-process server (`server.js`).** One Node entry point boots Next.js, spawns the LiveKit binary (`--dev` locally, env-provided keys in production), registers graceful shutdown hooks, starts the reminder and outreach-reply worker intervals, and attaches Socket.io. Every socket handshake must present a valid session cookie (JWT verified with `jose`, HS256); workspace/channel joins re-query membership and private-channel role allowlists from Prisma before joining a room.
- **HTTP API (`src/app/api/**`).** Route handlers grouped by domain: auth (login, me, password reset), organization/team/workspace membership, channels and messages, meetings, calendar, emails, forms (public + submissions), outreach (campaigns, tracking, replies, analytics), newsletter, pricing, Stripe (checkout/portal/webhook), MCP, and internal cron-triggered endpoints protected by a shared secret header.
- **Data layer (`prisma/`).** SQLite schema covering users, organizations, workspaces/channels/messages, meetings, employees/attendance, customers, leads, deals, campaigns, automations, forms, calendar, newsletters, MCP access tokens, pricing plans, and more; generated client lives under `src/generated`.
- **Domain libraries (`src/lib/`).** `auth.ts` (JWT sessions + global API key path), workers (`reminder-worker.ts`, `outreach-worker.ts`, `outreach-reply-worker.ts`), `britledger/*` (bookkeeping client), `scraper-service.ts` + `google-maps-scraper.ts`, `mailer.ts`/`system-mailer.ts` (transactional vs newsletter SMTP streams), `mcp-tokens.ts`, `pricing.ts`, `seo.ts`.
- **MCP layer (`src/mcp/`).** `server.ts` builds the unified "britcrm" MCP server; `tools/` implements domain tools (admin, billing, calendar, forms, leads, mail, outreach); `resources/` exposes docs and snapshots; `src/app/api/mcp/route.ts` terminates the Streamable HTTP transport with origin allowlisting and bearer-token resolution.
- **Frontend (`src/app/**`).** Dashboard routes for leads, customers, billing, campaigns, inbox, calendar, meet, team, settings, and onboarding, plus public marketing pages (landing, pricing, solutions, privacy/terms) and `/meet/[id]` for guest meeting joins.

## Project Structure

```text
crm/
+-- server.js               # Next + Socket.io + LiveKit spawn + worker loops
+-- ecosystem.config.cjs    # PM2 production config
+-- prisma/                 # schema.prisma, migrations/, seed.ts
+-- src/
¦   +-- app/
¦   ¦   +-- api/            # REST-ish route handlers by domain
¦   ¦   +-- admin/          # Users, organizations, pricing, system email, ops
¦   ¦   +-- meet/[id]/      # LiveKit meeting room with background effects
¦   ¦   +-- portal/ billing/ leads/ campaigns/ inbox/ calendar/ ...
¦   ¦   +-- mcp/            # Public MCP documentation page
¦   +-- components/         # Feature components (workspace, inbox, billing, admin)
¦   +-- lib/                # auth, workers, britledger client, scrapers, mailers, seo
¦   +-- mcp/                # MCP server, tools/, resources/
¦   +-- generated/          # Prisma client output
+-- scripts/                # create-admin.ts, IMAP/inbox diagnostic scripts
+-- livekit/                # LiveKit binary target dir (populated by setup script)
+-- socket.io/              # Reserved placeholder directory
+-- docs/                   # mcp/ plans + README, seo/ guide, superpowers/ plans & specs
```

## Getting Started

### Prerequisites

- Node.js 20+ (Next.js 16 requirement; 22 recommended)
- Native build toolchain for `better-sqlite3` (C/C++ compiler on Windows/Linux)
- LiveKit server binary v1.9.12 for meetings (downloaded by the setup script on Linux)
- PM2 for production process management

### Installation

1. Install dependencies (also generates the Prisma client):
   ```bash
   npm install
   ```
2. Apply database migrations:
   ```bash
   npx prisma migrate dev
   ```
3. Seed initial data if needed:
   ```bash
   npx tsx prisma/seed.ts
   ```
4. Create the first admin user:
   ```bash
   npm run admin:create
   ```
5. Optional - fetch the LiveKit server binary:
   ```bash
   npm run setup:livekit
   ```

### Environment Variables

Names only - never commit real values:

| Variable | Purpose | Example placeholder |
|---|---|---|
| `DATABASE_URL` | SQLite file URL for Prisma | `file:./prisma/dev.db` |
| `JWT_SECRET` | Signing key for session JWTs and socket verification | `change-me-long-random` |
| `PORT` / `NODE_ENV` | Server port and mode | `3001`, `production` |
| `SOCKET_ALLOWED_ORIGINS` | CORS origins accepted by Socket.io | `https://example.com` |
| `INTERNAL_CRON_SECRET` | Header secret protecting internal cron trigger endpoints | `change-me-random` |
| `GLOBAL_API_KEY` | Machine-to-machine admin API key (`x-api-key`) | `change-me-random` |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | Credentials passed to the spawned LiveKit server | `change-me` |
| `LIVEKIT_HOST` / `NEXT_PUBLIC_LIVEKIT_URL` | Meeting endpoints exposed to clients | `https://meet.example.com`, `wss://meet.example.com` |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` / `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SITE_URL` | Canonical app URLs used for links, MCP origin allowlist, SEO | `https://example.com` |
| `GEMINI_API_KEY` | Google Gemini key for AI agents | `change-me` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe subscription billing | `sk_test_...`, `whsec_...` |
| `BRITLEDGER_API_URL` / `BRITLEDGER_EMAIL` / `BRITLEDGER_PASSWORD` | External BritLedger bookkeeping service credentials | `change-me` |
| `BRITLEDGER_PASSWORD_SECRET` | Shared secret for BritLedger user sync (falls back to `JWT_SECRET`) | `change-me` |
| `SYSTEM_SMTP_HOST` / `SYSTEM_SMTP_USER_*` / `SYSTEM_SMTP_PASSWORD` / `SYSTEM_SMTP_FROM_*` / `SYSTEM_SMTP_PORT_*` | Admin-managed system SMTP streams (transactional + newsletter) | `change-me` |
| `UNSUBSCRIBE_SECRET` | Signing secret for unsubscribe links | `change-me-random` |
| `EXTERNAL_API_BASE_URL` / `EXTERNAL_API_KEY` (+ `NEXT_PUBLIC_` variants) | External lead-finder API | `https://api.example.com`, `change-me` |
| `AUTO_REMINDER_WORKER` / `REMINDER_WORKER_SECONDS` | In-process reminder loop toggles/timing | `true`, `60` |
| `AUTO_OUTREACH_REPLY_WORKER` / `OUTREACH_REPLY_WORKER_SECONDS` | Outreach reply-polling loop toggles/timing | `true`, `180` |
| `BRITCRM_MCP_USER_ID` / `BRITCRM_MCP_USER_EMAIL` | Local stdio MCP operator identity only (not for end users) | `local-dev-user` |

### Running

- Development (custom server on port 3001):
  ```bash
  npm run dev
  ```
- Production build and start:
  ```bash
  npm run build
  npm start
  ```
- Production via PM2:
  ```bash
  pm2 start ecosystem.config.cjs
  ```
- Local MCP stdio transport:
  ```bash
  npm run mcp
  ```

## Challenges Faced & Solutions

- **Browser virtual backgrounds were low quality and fragile** - a long commit arc (`Add LiveKit background effects`, then `Improve meeting background segmentation quality`, `Remove heavy virtual background wrapper`, `Use prebuilt virtual background processor`, `Use stronger meeting segmentation model`, `Serve MediaPipe background assets locally`) shows repeated rewrites. Solution: settled on LiveKit's prebuilt track processor fed by a stronger segmentation model, with MediaPipe WASM/model assets served from the app itself instead of a CDN, eliminating network flakiness and version drift.
- **Processed preview tracks broke camera geometry and mobile** - enabling effects distorted aspect ratios and crashed on some phones. Solution: `Preserve camera aspect ratio in meeting effects` kept source dimensions through the processing pipeline, `Guard meeting background canvas dimensions` clamped canvas sizes before rendering, and `Make meeting camera preview mobile safe` hardened the preview path; `Require manual camera preview before meeting join` added an explicit pre-join gate so permissions and device selection are confirmed up front.
- **Meetings failed for users without cameras or microphones** - join flows assumed media existed. Solution: `Allow meeting join without camera or mic` decoupled room admission from device publishing so guests can observe calls, while processed tracks are only published when actually produced (`Publish processed meeting preview track`).
- **Realtime chat needed real authorization, not just a socket connection** - anyone holding a socket could otherwise join any room. Solution: the server verifies the signed session JWT during the handshake, then `join-workspace`, `join-channel`, and every `chat:message` re-validate ownership/membership against Prisma, including private-channel role allowlists; unauthorized requests are rejected with explicit error events, and allowed origins are restricted via `SOCKET_ALLOWED_ORIGINS`.
- **AI agents needed safe, scoped CRM access** - early MCP exposure risked over-broad access. Solution: `Add unified MCP server tools` consolidated domain tools behind one server, `Add per-user MCP setup page` introduced self-service bearer tokens backed by the `McpAccessToken` model (tools act strictly as the token's user and revocation blocks future calls), and `Harden MCP docs and transport` tightened origin checks and published safe-by-default agent documentation at `/mcp/docs`.
- **Bulk lead deletion silently misbehaved** - the finder page's optimistic state diverged from the server action's accepted selections. Solution: `Fix bulk lead deletion` corrected `finder/actions.ts` validation and resynchronized `LeadsPageClient.tsx` state so deletions match exactly what was selected.
- **Billing balances drifted from the external ledger** - the built-in billing module and BritLedger disagreed on outstanding amounts. Solution: `Align billing balance flow with BritLedger` routed balance computation through the dedicated `src/lib/britledger` client (invoices, payments, quotations, VAT), making the external ledger authoritative for money owed.

## Known Limitations & Roadmap

- Released under the MIT License (see [LICENSE](./LICENSE)).
- SQLite plus a single Node process caps horizontal scale; moving to Postgres or splitting workers into separate processes would be required for multi-instance deployments.
- The committed `prisma/dev.db` (plus `-shm`/`-wal`) and `dev-server*.log` files should be removed from history and ignored.
- `ecosystem.config.cjs` embeds placeholder/default credential values inline; production secrets should live exclusively in the environment.
- Debug/diagnostic surfaces remain reachable: `api/debug-session`, `api/test-route`, root-level `test-*.js` scripts, and several `check-*` scripts.
- Several commit messages ("hehe", "je", "gs") obscure history; conventional commits would improve traceability.
- `socket.io/` and `livekit/` directories are placeholders/binaries rather than code; no automated test suite exists beyond ad-hoc scripts.

## Security Notes

Observed practices: bcrypt password hashing; jose-signed HS256 session JWTs stored in httpOnly, sameSite=lax cookies (secure flag in production) with 24-hour expiry; mandatory JWT verification for every Socket.io handshake followed by per-event database-backed authorization; CORS origin allowlists for both sockets and the MCP transport; shared-secret headers guarding internal cron endpoints; per-user, revocable MCP bearer tokens whose tools operate strictly within the token owner's records (admin tools additionally require `role === "ADMIN"`); Stripe webhooks verified against `STRIPE_WEBHOOK_SECRET`; `sanitize-html` available for rendering untrusted mail content; signed unsubscribe links.

Hygiene warnings (filenames only): `prisma/dev.db`, `prisma/dev.db-shm`, `prisma/dev.db-wal`, `dev-server.log`, `dev-server-err.log`, `server-log.txt`, `error.txt`, and `lint_results.txt` are tracked in git; `ecosystem.config.cjs` contains placeholder/default key material inline (`your-secure-api-key`-style values and LiveKit dev defaults). Rotate anything sensitive that ever touched the dev database and purge these paths from history.

## License

MIT License — Copyright (c) 2026 Musfiqur Rahman Saimon. See [LICENSE](./LICENSE).
