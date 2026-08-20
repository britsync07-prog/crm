# BritCRM MCP Server Plan

## Purpose

Build a first-party MCP server that lets approved AI agents operate BritCRM through safe, typed tools instead of browser clicks. The MCP server should expose business actions for inbox, leads, outreach, forms, calendar, billing, and admin/pricing while preserving the same user ownership rules already used by the Next.js app.

## Architecture

- Runtime: Node.js/TypeScript MCP server inside this repo.
- Data layer: reuse `prisma` from `src/lib/db`.
- Auth context: every MCP call must run with an explicit `userId`, `role`, and optional `organizationId`.
- Tool design: tools perform business operations; resources expose read-only snapshots and docs.
- Transport: start with stdio for local agents, then add HTTP/SSE only when remote agents need access.
- Auditing: every write tool should record who invoked it, what changed, and the request id.

## Proposed Folder Structure

```text
src/mcp/
  server.ts
  context.ts
  auth.ts
  audit.ts
  schemas/
  tools/
    mail.ts
    leads.ts
    outreach.ts
    forms.ts
    calendar.ts
    billing.ts
    admin.ts
  resources/
    docs.ts
    snapshots.ts
```

## Core MCP Resources

- `britcrm://docs/index`: links to all MCP docs.
- `britcrm://docs/mail`: mail and unified inbox instructions.
- `britcrm://docs/leads`: lead management instructions.
- `britcrm://docs/outreach`: campaign and follow-up instructions.
- `britcrm://docs/forms`: form creation and submission instructions.
- `britcrm://docs/calendar`: calendar, availability, and meeting booking instructions.
- `britcrm://docs/billing`: invoice, quote, client, and balance instructions.
- `britcrm://docs/admin`: pricing, discounts, trials, users, and operational controls.
- `britcrm://snapshot/user`: current user's account, role, connected mailboxes, and key counts.

## Local Run Command

```bash
BRITCRM_MCP_USER_EMAIL=user@example.com npm run mcp
```

Use either `BRITCRM_MCP_USER_ID` or `BRITCRM_MCP_USER_EMAIL`. Tools that touch CRM data fail closed when neither value is present.

## Implemented Tools

Mail tools are implemented inside the unified server:

- `mail.list_accounts`
- `mail.search_messages`
- `mail.read_message`
- `mail.draft_reply`
- `mail.send_email`
- `mail.batch_action`

Lead tools are implemented inside the unified server:

- `leads.list`
- `leads.get`
- `leads.create`
- `leads.update`
- `leads.upload_csv`
- `leads.score`
- `leads.log_interaction`
- `leads.convert_to_customer`

Outreach tools are implemented inside the unified server:

- `outreach.preview_campaign`
- `outreach.launch_campaign`
- `outreach.list_campaigns`
- `outreach.get_campaign`
- `outreach.send_follow_up`
- `outreach.process_replies`

Form tools are implemented inside the unified server:

- `forms.list`
- `forms.create`
- `forms.delete`
- `forms.get_submissions`
- `forms.submit_public`
- `forms.generate_share_message`

Calendar tools are implemented inside the unified server:

- `calendar.get_settings`
- `calendar.update_settings`
- `calendar.list_events`
- `calendar.check_availability`
- `calendar.create_event`
- `calendar.book_client_meeting`
- `calendar.cancel_event`

Billing tools are implemented inside the unified server:

- `billing.list_clients`
- `billing.create_client`
- `billing.list_invoices`
- `billing.create_invoice`
- `billing.update_invoice`
- `billing.record_payment`
- `billing.create_quotation`
- `billing.list_quotations`
- `billing.convert_quote_to_invoice`
- `billing.send_invoice`

Admin/Pricing tools are implemented inside the unified server and require `role === "ADMIN"`:

- `admin.pricing.list_plans`
- `admin.pricing.upsert_plan`
- `admin.pricing.upsert_discount_event`
- `admin.users.search`
- `admin.users.update`
- `admin.system_email.update_profile`
- `admin.operations.snapshot`

## Cross-Cutting Tool Rules

- Never allow a tool to operate without a resolved user context.
- Always filter user-owned records by `userId`, `ownerId`, or organization membership.
- Admin tools must require `role === "ADMIN"`.
- Destructive tools need a `confirm: true` flag and should return a preview when omitted.
- Sending email or campaigns must support dry-run previews.
- Calendar booking must check conflicts inside the same transaction used to create the event.
- All tools must return structured JSON with `success`, `data`, and `error` fields.

## Build Phases

1. Create the MCP server skeleton and expose docs resources.
2. Add read-only tools for each page so agents can inspect CRM state.
3. Add safe write tools for mail replies, lead updates, form creation, and calendar booking.
4. Add outreach campaign creation with previews and explicit send confirmation.
5. Add billing and admin controls after stronger audit logging is in place.
6. Add integration tests that call MCP tools directly against a test database.

## Acceptance Checks

- An agent can discover all page docs through `britcrm://docs/index`.
- Each tool validates input with schemas before touching Prisma.
- Normal users cannot access another user's data.
- Admin-only actions fail for non-admin users.
- Email sends, outreach launches, calendar bookings, and invoice changes create audit records.
- The MCP server can run locally with `npm run mcp` after implementation.
