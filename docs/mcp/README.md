# BritCRM MCP Agent Guide

## Purpose

This is the live operating guide for the unified BritCRM MCP server. AI agents should read this document first through `britcrm://docs/index`, then use the page-specific docs and tools below to safely inspect, create, update, send, and manage CRM data.

The server is implemented in `src/mcp/server.ts` and exposes one MCP server named `britcrm`. Production users connect through the hosted Streamable HTTP endpoint at `/api/mcp`; local operators can still use stdio for development. The same server registers resources plus tools for Mail, Leads, Outreach, Forms, Calendar, Billing, and Admin/Pricing.

## Normal User Setup

Each active CRM user creates their own MCP token from `/settings/mcp`. MCP clients should configure the hosted endpoint like this:

```json
{
  "mcpServers": {
    "britcrm": {
      "url": "https://your-crm-domain.com/api/mcp",
      "headers": {
        "Authorization": "Bearer bcrm_mcp_generated_token"
      }
    }
  }
}
```

Users never configure local project paths, database URLs, JWT secrets, or other server environment values in their agent. Those values stay on the CRM deployment.

When an agent uses a token, tools write to the same user-owned records visible in that user's dashboard. Revoking the token from `/settings/mcp` blocks future calls.

## Server Environment

The deployed CRM server owns the database and app secrets. Billing tools also use BritLedger. For BritLedger user sync, server operators should set one of:

- `BRITLEDGER_PASSWORD_SECRET`
- `JWT_SECRET`

Admin tools require the resolved CRM user to have `role === "ADMIN"`.

## Local Operator Setup

For local development only, start the stdio transport from the CRM project root:

```bash
cd D:\job\crm
npm run mcp
```

The local stdio transport can read `BRITCRM_MCP_USER_ID` or `BRITCRM_MCP_USER_EMAIL` from the operator's process environment. This is not the normal end-user setup.

## Response Contract

Every tool returns text containing JSON:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

On failure:

```json
{
  "success": false,
  "data": null,
  "error": "Human readable error"
}
```

Agents should parse `content[0].text` as JSON, check `success`, and only use `data` when `success` is true.

## Safety Rules For Agents

- Read before writing. Use list/get/preview tools before create/update/send tools.
- Respect ownership. Normal tools operate only on the resolved MCP user's records.
- Admin tools are global and require an admin user.
- Use `confirm: false` first for any tool that supports confirmation.
- Only set `confirm: true` after the user explicitly approves the preview.
- Never invent record IDs. Pull IDs from list/get tool results.
- Never expose SMTP passwords. `admin.system_email.update_profile` accepts a password but never returns it.
- For outreach and meeting tools, expect real emails or calendar records to be created when confirmed.
- For billing tools, all invoice and quote totals are calculated server-side. Agents can pass direct line `amount` or `quantity` plus `unitCost`.

## Resource Index

- `britcrm://docs/index`: this guide.
- `britcrm://docs/mail`: unified inbox plan and mail usage.
- `britcrm://docs/leads`: lead management plan and lifecycle.
- `britcrm://docs/outreach`: campaign, follow-up, and reply processing plan.
- `britcrm://docs/forms`: forms, submissions, CRM sync, and meeting intake plan.
- `britcrm://docs/calendar`: availability, meetings, and no double-booking plan.
- `britcrm://docs/billing`: clients, invoices, quotations, payments, and balances plan.
- `britcrm://docs/admin`: pricing, discounts, trials, users, system email, and operations plan.
- `britcrm://snapshot/user`: current MCP user's account, organization, dashboard counts, upcoming events, and recent activity.

## Per-User MCP Setup

Every active CRM user can create one or more bearer tokens for their account. The server is shared code, but each request is user-bound by the token presented to `/api/mcp`.

User-bound MCP effects:

- `leads.*` changes appear on `/leads`.
- `mail.*` uses mailboxes connected on `/settings/email`.
- `outreach.*` changes appear on `/campaigns`.
- `forms.*` changes appear on `/forms`.
- `calendar.*` changes appear on `/calendar`.
- `billing.*` changes appear on `/billing` through that user's BritLedger account.
- `admin.*` works only for users with `role === "ADMIN"`.

Agents should read `britcrm://snapshot/user` at startup to confirm which CRM account they are operating on.

## Common Agent Workflows

### Pull CRM Lead Info

1. Call `leads.list` with filters.
2. Pick a lead ID from the returned rows.
3. Call `leads.get` for full lead context, including interactions, tasks, deals, and campaign history.

### Update A Lead

1. Call `leads.get`.
2. Call `leads.update` with only changed fields.
3. Use `leads.log_interaction` after calls, replies, or notes.

### Send Or Reply To Email

1. Call `mail.list_accounts`.
2. Call `mail.search_messages`.
3. Call `mail.read_message`.
4. Call `mail.draft_reply` to prepare content.
5. Call `mail.send_email` only after user approval.

### Launch Outreach

1. Call `outreach.preview_campaign`.
2. Show the recipient count, invalid recipients, duplicate count, and sender accounts to the user.
3. Call `outreach.launch_campaign` with the same input and `confirm: true`.
4. Later call `outreach.process_replies`.
5. Use `outreach.get_campaign` for metrics and per-lead status.

### Create A Form And Collect Client Info

1. Call `forms.create`.
2. Call `forms.generate_share_message`.
3. After submissions, call `forms.get_submissions`.
4. Use `forms.submit_public` only when the agent is intentionally submitting intake data on behalf of a user/client.

### Book A Client Meeting

1. Call `calendar.get_settings`.
2. Call `calendar.check_availability`.
3. Call `calendar.book_client_meeting` with `confirm: false`.
4. After approval, call the same tool with `confirm: true`.
5. Use `calendar.cancel_event` with `confirm: true` only after approval.

### Create Invoice And Put Balance

1. Call `billing.list_clients` or `billing.create_client`.
2. Call `billing.create_invoice` with line items.
3. Each line item can use either:
   - direct `amount`
   - or `quantity` plus `unitCost`
4. Include `discount`, `advancePayment`, `currency`, and `vatRate` as needed.
5. Read returned `calculations.balanceDue`.
6. Use `billing.record_payment` to reduce the balance later.

### Manage Pricing, Discount Events, And Trials

1. Call `admin.pricing.list_plans`.
2. Use `admin.pricing.upsert_plan` with `confirm: false` to preview price, seat, feature, Stripe, and trial-day changes.
3. Use `admin.pricing.upsert_discount_event` with `confirm: false` to preview frontend-visible offers.
4. Apply with `confirm: true` only after approval.
5. Use `admin.operations.snapshot` to audit counts and configuration health.

## Tool Catalog

### Mail Tools

`mail.list_accounts`

- Pulls active mail accounts for the MCP user.
- Input: none.
- Returns account IDs, email addresses, SMTP/IMAP host metadata, warmup status, and `sentToday`.
- Does not return passwords.

`mail.search_messages`

- Pulls recent mailbox messages.
- Input: `accountId?`, `mailbox = "INBOX"`, `query?`, `limit = 50`.
- Use `accountId` from `mail.list_accounts`. If omitted, the first active IMAP account is used.

`mail.read_message`

- Gets one message body.
- Input: `uid`, `accountId?`, `mailbox = "INBOX"`.
- Use a UID returned by `mail.search_messages`.

`mail.draft_reply`

- Creates a draft reply body. It does not send.
- Input: `uid`, `instructions`, `accountId?`, `mailbox = "INBOX"`, `tone = "professional"`.

`mail.send_email`

- Sends a real email from a user-owned account.
- Input: `to[]`, `subject`, `htmlBody`, `accountId?`, `senderName?`, `replyToUid?`.
- Use only after approval.

`mail.batch_action`

- Performs mailbox actions.
- Input: `accountId?`, `mailbox = "INBOX"`, `uids[]`, `action`.
- Actions: `archive`, `trash`, `spam`, `read`, `unread`, `star`, `unstar`.

### Lead Tools

`leads.list`

- Pulls leads owned by the MCP user.
- Input: `query?`, `status?`, `categoryId?`, `limit = 50`, `offset = 0`, `sortBy = "updatedAt"`, `sortDirection = "desc"`.

`leads.get`

- Gets one lead and related activity.
- Input: `leadId`.

`leads.create`

- Creates one user-owned lead.
- Input: `name`, `email`, and optional fields: `phone`, `company`, `licenseType`, `areaOfOperation`, `dealFocus`, `budgetRange`, `website`, `industry`, `location`, `address`, `rating`, `linkedin`, `source`, `status`, `categoryId`.

`leads.update`

- Updates one user-owned lead.
- Input: `leadId` plus any editable lead fields.

`leads.upload_csv`

- Imports leads from CSV text.
- Input: `csvText`, `categoryId?`, `source = "MCP CSV Upload"`, `updateExisting = false`.
- Auto-detects comma, semicolon, or tab delimiter.

`leads.score`

- Runs lead AI scoring.
- Input: `leadId`.
- Returns score/insights where configured.

`leads.log_interaction`

- Logs an interaction against a lead.
- Input: `leadId`, `type = "Note"`, `content`, `sentiment?`, `moveToContacted = true`.

`leads.convert_to_customer`

- Converts a lead to customer.
- Input: `leadId`, `confirm = false`.
- Requires `confirm: true` to write.

### Outreach Tools

`outreach.preview_campaign`

- Previews recipients and sender accounts without sending.
- Input: `campaignName`, `senderName = "BritCRM Outreach"`, `subject`, `htmlContent`, `recipients = ""`, `includeManualRecipients = true`, `leadFilters`, `smtpAccountIds[]`.
- `leadFilters`: `enabled`, `categoryIds[]`, `includeStatuses[]`, `excludeStatuses[]`.

`outreach.launch_campaign`

- Sends/launches a campaign.
- Input: same as preview plus `confirm = false`.
- Requires `confirm: true`.

`outreach.list_campaigns`

- Pulls campaign history.
- Input: `status?`, `limit = 50`, `offset = 0`.

`outreach.get_campaign`

- Gets one campaign with lead-level delivery status and metrics.
- Input: `campaignId`.

`outreach.send_follow_up`

- Creates and launches a follow-up campaign for an existing campaign.
- Input: `campaignId`, `targetFilter`, `customStatus?`, `senderName`, `subject`, `htmlContent`, `smtpAccountIds[]`, `confirm = false`.
- Requires `confirm: true`.

`outreach.process_replies`

- Scans connected inboxes for outreach replies for the MCP user.
- Input: none.

### Form Tools

`forms.list`

- Pulls forms owned by the MCP user.
- Input: `search?`, `limit = 50`, `offset = 0`.

`forms.create`

- Creates a form.
- Input: `title`, `description?`, `fields[]`, `meetingSchedulingEnabled = false`, `meetingDurationMin = 60`.
- Field types: `TEXT`, `TEXTAREA`, `DROPDOWN`, `RADIO`, `CHECKBOX`, `EMAIL`, `PHONE`.
- Each field: `label`, `type`, `required`, `options[]`.

`forms.delete`

- Deletes a form and submissions.
- Input: `formId`, `confirm = false`.
- Requires `confirm: true`.

`forms.get_submissions`

- Pulls parsed submissions and CRM links for a user-owned form.
- Input: `formId`, `limit = 50`, `offset = 0`.

`forms.submit_public`

- Submits an owned public form as an MCP intake action.
- Input: `formId`, `responses`, optional `meeting`.
- `responses` is keyed by form field ID.
- `meeting` can include `slotStart`, `email`, and scheduling metadata when the form supports meetings.

`forms.generate_share_message`

- Creates a share message with the public form URL.
- Input: `formId`, `tone = "professional"`.

### Calendar Tools

`calendar.get_settings`

- Pulls availability settings for the MCP user.
- Input: none.

`calendar.update_settings`

- Updates availability.
- Input: `availableStart = "09:00"`, `availableEnd = "17:00"`, `timeZone = "UTC"`, `reminderAccountId?`.
- Time format is `HH:MM`.

`calendar.list_events`

- Pulls events.
- Input: `start?`, `end?`, `limit = 200`.
- If using date range, provide both `start` and `end`.

`calendar.check_availability`

- Computes free slots.
- Input: `date`, `durationMin = 60`.
- Date should be ISO-like, for example `2026-08-21`.

`calendar.create_event`

- Creates a manual calendar event after conflict checking.
- Input: `title`, `description?`, `start`, `end`, `source = "MCP"`.

`calendar.book_client_meeting`

- Books a client meeting, LiveKit room, locked calendar event, and optional confirmation emails.
- Input: `title`, `clientEmail`, `start`, `end`, `notes?`, `sendConfirmation = true`, `confirm = false`.
- Requires `confirm: true`.

`calendar.cancel_event`

- Cancels/deletes a calendar event and linked meeting resources.
- Input: `eventId`, `confirm = false`.
- Requires `confirm: true`.

### Billing Tools

`billing.list_clients`

- Pulls BritLedger billing clients.
- Input: `search?`, `page = 1`, `pageSize = 25`, `includeBalances = false`.

`billing.create_client`

- Creates a BritLedger billing client.
- Input: `name`, `email?`, `phone?`, `address?`, `companyName?`, `vatNumber?`, `isActive = true`.

`billing.list_invoices`

- Pulls invoices and computed balance due.
- Input: `clientId?`, `status?`, `search?`, `page = 1`, `pageSize = 25`.

`billing.create_invoice`

- Creates an invoice with server-side totals.
- Input: `clientId`, `invoiceNumber?`, `issueDate?`, `dueDate?`, `currency = "GBP"`, `status = "DRAFT"`, `lineItems[]`, `discount = 0`, `advancePayment = 0`, `markPaid = false`, `notes?`.
- Line item: `description`, `quantity = 1`, `unitCost?`, `rate?`, `amount?`, `vatRate = 0`.
- If `amount` is supplied, it is used directly and unit cost is derived.

`billing.update_invoice`

- Updates invoice fields and recalculates totals if line items are supplied.
- Input: `invoiceId`, optional invoice fields, optional `lineItems[]`, optional `discount`, `advancePayment`, `markPaid`.

`billing.record_payment`

- Records payment by increasing invoice advance paid and updating status/balance.
- Input: `invoiceId`, `amount`, `currency?`, `paymentMethod?`, `notes?`.

`billing.create_quotation`

- Creates a quotation with server-side totals.
- Input: `clientId`, `quotationNumber?`, `issueDate?`, `expiryDate?`, `currency = "GBP"`, `status = "Draft"`, `lineItems[]`, `discount = 0`, `notes?`.

`billing.list_quotations`

- Pulls quotations.
- Input: `clientId?`, `status?`, `page = 1`, `pageSize = 25`.

`billing.convert_quote_to_invoice`

- Converts a quotation to invoice.
- Input: `quotationId`, `confirm`.
- Requires `confirm: true`.

`billing.send_invoice`

- Sends an invoice by email through BritLedger.
- Input: `invoiceId`, `toEmail`, `subject?`, `personalMessage?`, `includePaymentLink = true`.

### Admin And Pricing Tools

All tools in this section require `role === "ADMIN"`.

`admin.pricing.list_plans`

- Pulls pricing plans, discount events, and optional frontend public preview.
- Input: `includePublicPreview = true`.

`admin.pricing.upsert_plan`

- Creates or updates a pricing plan.
- Input: `id?`, `slug`, `name`, `description = ""`, `monthlyPriceCents`, `seatLimit`, `features[]`, `stripePriceId?`, `isActive = true`, `isPopular = false`, `sortOrder = 0`, `trialDays = 14`, `ctaLabel?`, `confirm = false`.
- Use `monthlyPriceCents: null` for custom/enterprise pricing.
- Use `seatLimit: null` for unlimited seats.
- Requires `confirm: true` to write.

`admin.pricing.upsert_discount_event`

- Creates or updates a frontend-visible discount/offer event.
- Input: `id?`, `title`, `description = ""`, `discountPercent`, `couponCode?`, `startsAt`, `endsAt`, `appliesToPlanSlug?`, `isActive = true`, `confirm = false`.
- `discountPercent` must be 1 to 95.
- Requires `confirm: true` to write.

`admin.users.search`

- Pulls users with organization summary.
- Input: `query = ""`, `role?`, `status?`, `plan?`, `page = 1`, `pageSize = 25`.
- Does not return passwords or reset tokens.

`admin.users.update`

- Updates user role/status and owned organization subscription fields.
- Input: `userId`, `role?`, `status?`, `plan?`, `subscriptionStatus?`, `seatLimit?`, `confirm = false`.
- Blocks self-demotion and self-suspension.
- Requires `confirm: true`.

`admin.system_email.update_profile`

- Updates transactional or newsletter SMTP profile.
- Input: `profile`, `host`, `port = 587`, `username`, `password?`, `fromEmail`, `fromName = "BritCRM"`, `secureMode = "STARTTLS"`, `isEnabled = true`, `confirm = false`.
- Password is write-only and returned only as `[redacted]` in previews.
- Requires `confirm: true`.

`admin.operations.snapshot`

- Pulls operational counts, configuration readiness, redacted system email profile status, and recent activity.
- Input: none.

## Current Verified Tool Count

The server exposes 50 tools:

- 6 mail tools
- 8 lead tools
- 6 outreach tools
- 6 form tools
- 7 calendar tools
- 10 billing tools
- 7 admin/pricing tools

## Validation Status

Latest local audit checks:

- TypeScript passed with `tsc --noEmit`.
- Targeted ESLint passed for MCP and touched integration files.
- Production build passed with `npm run build`.
- MCP hosted endpoint rejects unauthenticated requests.
- MCP stdio tool discovery returned all 50 tools for local development.
- MCP resource discovery returns docs resources plus `britcrm://snapshot/user`.
- Admin tools reject a normal user.
- Admin tools work with admin context by email or ID.
- BritLedger-backed billing tools work with MCP email-only context.
- Stdio-only mismatched `BRITCRM_MCP_USER_ID` and `BRITCRM_MCP_USER_EMAIL` fails closed.
