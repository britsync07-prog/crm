# Outreach MCP Plan

## Page Scope

This covers `/campaigns`, campaign launching, campaign history, analytics, open tracking, replies, follow-ups, and sender account rotation.

## Existing System Notes

- Campaigns use `Campaign` and `CampaignLead`.
- Current launch API: `POST /api/outreach/campaigns`.
- History API: `GET /api/outreach/campaigns`.
- Account analytics: `GET /api/outreach/analytics/account`.
- Campaign analytics: `GET /api/outreach/analytics/[campaignId]`.
- Open tracking: `GET /api/outreach/track/open`.
- Reply detection worker: `src/lib/outreach-reply-worker.ts`.
- Sending is routed through `sendRealEmail`.
- Campaign send limits have been removed.

## MCP Resources

- `britcrm://outreach/campaigns`: all campaigns for the user.
- `britcrm://outreach/campaigns/{id}`: campaign detail with leads and analytics.
- `britcrm://outreach/senders`: active sender accounts.
- `britcrm://docs/outreach`: this document.

## MCP Tools

Implemented in `src/mcp/tools/outreach.ts`:

- `outreach.preview_campaign`
- `outreach.launch_campaign`
- `outreach.list_campaigns`
- `outreach.get_campaign`
- `outreach.send_follow_up`
- `outreach.process_replies`

### `outreach.preview_campaign`

Input: campaign name, sender name, subject, HTML content, recipient source, lead filters, manual recipients, sender account ids.

Returns recipient count, duplicate count, invalid emails, selected sender accounts, and a rendered sample.

### `outreach.launch_campaign`

Input: same fields as preview plus `confirm: true`.

Creates a campaign, creates or links leads for recipients, and queues sending.

### `outreach.list_campaigns`

Input: optional status, date range, search.

Returns campaigns with sent, delivered, bounced, opens, replies, and rates.

### `outreach.get_campaign`

Input: `campaignId`.

Returns full campaign detail with lead-level delivery status.

### `outreach.send_follow_up`

Input: `campaignId`, target filter, subject, HTML body, sender account ids, confirm.

Targets leads that match filters such as no reply, opened but not replied, bounced excluded, or custom status.

### `outreach.process_replies`

Input: optional accountId and date range.

Runs reply detection and marks related `CampaignLead.repliedAt`.

Current implementation runs reply detection for the MCP user's connected inboxes only. It does not scan other users' mailboxes.

## Agent Workflow

1. Pick target leads using lead filters.
2. Generate subject and HTML message.
3. Preview recipients and sample personalization.
4. Launch only after policy confirmation.
5. Monitor analytics.
6. Process replies into lead/customer interactions.
7. Send follow-ups only to eligible recipients.

## Safety Requirements

- Sending tools must require explicit `confirm: true`.
- Tools must verify all sender accounts belong to the current user.
- Exclude unsubscribed or suppression-list contacts once those tables exist.
- Never send follow-ups to bounced recipients unless explicitly overridden.
- Store campaign action logs.

## Implementation Gaps

- Add unsubscribe/suppression models.
- Add scheduled campaigns and follow-up sequences.
- Add reply-to-thread support in `sendRealEmail`.
- Add rate controls based on SMTP health, not user plan limits.
