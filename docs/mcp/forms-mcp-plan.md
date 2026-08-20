# Forms MCP Plan

## Page Scope

This covers `/forms`, `/forms/new`, `/forms/[id]/submissions`, public form submission, CRM lead sync, and optional meeting booking after submission.

## Existing System Notes

- Forms use `Form`, `FormField`, and `FormSubmission`.
- Authenticated form APIs exist under `/api/forms`.
- Public form submit API exists at `/api/forms/public/[id]/submit`.
- Form submission can upsert a lead through `upsertLeadFromFormSubmission`.
- Meeting-enabled forms create `Meeting` and locked `CalendarEvent` records.

## MCP Resources

- `britcrm://forms/list`: current user's forms with submission counts.
- `britcrm://forms/{id}`: form definition and public link.
- `britcrm://forms/{id}/submissions`: parsed submissions with CRM links.
- `britcrm://docs/forms`: this document.

## MCP Tools

Implemented in `src/mcp/tools/forms.ts`:

- `forms.list`
- `forms.create`
- `forms.delete`
- `forms.get_submissions`
- `forms.submit_public`
- `forms.generate_share_message`

### `forms.list`

Input: optional search.

Returns forms with title, description, meeting settings, submission count, and public URL.

### `forms.create`

Input:

```json
{
  "title": "Client onboarding",
  "description": "Collect onboarding details",
  "fields": [
    { "label": "Email", "type": "EMAIL", "required": true }
  ],
  "meetingSchedulingEnabled": true,
  "meetingDurationMin": 60
}
```

Creates a form with ordered fields.

### `forms.delete`

Input: `formId`, `confirm`.

Deletes the form and submissions after ownership check.

### `forms.get_submissions`

Input: `formId`.

Returns parsed submission data, detected submitter email, matching lead/customer, and meeting booking status.

### `forms.submit_public`

Input: `formId`, responses, optional meeting booking payload.

Used when an agent is acting as a client-facing intake agent.

Current implementation requires MCP user context and restricts submissions to forms owned by that MCP user. Meeting booking uses the existing availability, LiveKit, calendar, confirmation email, lead sync, and customer sync flow.

### `forms.generate_share_message`

Input: `formId`, recipient context, tone.

Returns a message containing the public form link.

## Agent Workflow

1. Create or select the right form for the client journey.
2. Share the public form link by email.
3. Monitor submissions.
4. Sync submitters into leads/customers.
5. If meeting scheduling is enabled, book available slots through calendar checks.
6. Summarize collected information for the user.

## Safety Requirements

- Authenticated form management must verify `ownerId === context.userId`.
- Public submission must validate required fields.
- Meeting slot booking must re-check availability inside the transaction.
- Deleting a form needs `confirm: true` because submissions are cascaded.

## Implementation Gaps

- Add update form endpoint and MCP tool.
- Add field validation types beyond required/not-required.
- Add webhook or MCP notification when a new submission arrives.
