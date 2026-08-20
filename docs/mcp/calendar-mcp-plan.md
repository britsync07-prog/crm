# Calendar MCP Plan

## Page Scope

This covers `/calendar`, calendar events, availability settings, reminders, form meeting bookings, and client onboarding meetings.

## Existing System Notes

- Events use `CalendarEvent`.
- Availability uses `CalendarSettings`.
- Meeting-enabled forms create locked calendar events with `source = "FORM_MEETING"`.
- Locked form meetings cannot be moved from the calendar event update route.
- Deleting a form meeting cancels the `Meeting`, deletes the LiveKit room when possible, and sends cancellation emails.

## MCP Resources

- `britcrm://calendar/events?start=&end=`: current user's events in a time range.
- `britcrm://calendar/settings`: availability window, timezone, reminder sender account.
- `britcrm://calendar/availability?date=&durationMin=`: computed free slots.
- `britcrm://docs/calendar`: this document.

## MCP Tools

Implemented in `src/mcp/tools/calendar.ts`:

- `calendar.get_settings`
- `calendar.update_settings`
- `calendar.list_events`
- `calendar.check_availability`
- `calendar.create_event`
- `calendar.book_client_meeting`
- `calendar.cancel_event`

### `calendar.get_settings`

Input: none.

Returns available start/end, timezone, and reminder account.

### `calendar.update_settings`

Input: availableStart, availableEnd, timeZone, optional reminderAccountId.

Updates settings after validating time format and mailbox ownership.

### `calendar.list_events`

Input: start ISO, end ISO.

Returns events that overlap the range.

### `calendar.check_availability`

Input: date or date range, duration minutes.

Returns free slots after comparing availability settings with existing events.

### `calendar.create_event`

Input: title, description, start, end, optional source.

Creates a manual calendar event after conflict checking.

### `calendar.book_client_meeting`

Input: client/lead email, title, start, end, optional formId, optional notes, confirm.

Creates a meeting event and can send confirmation email.

Current implementation requires `confirm=true`, checks conflicts before and inside the database transaction, creates a locked `CalendarEvent`, creates a `Meeting`, creates the LiveKit room, and can send confirmation email.

### `calendar.cancel_event`

Input: eventId, confirm.

Cancels/deletes an event. If it is a form meeting, also cancels the linked meeting room and notification flow.

## Agent Workflow

1. Read calendar settings and current events.
2. Offer only slots that do not overlap existing events.
3. Before booking, re-check the exact slot.
4. Create the event and send confirmation when a sender account exists.
5. Log the meeting against the related lead/customer when available.

## Safety Requirements

- Never double-book overlapping events.
- Do not move locked form meetings.
- Admin-created events for another user require `role === "ADMIN"`.
- Reminder sender account must belong to the event owner.
- Use timezone-aware input and output in all agent-facing responses.

## Implementation Gaps

- Add first-class availability endpoint for non-form bookings.
- Add meeting reminder MCP tool.
- Add reschedule flow that cancels old confirmation and sends new confirmation.
