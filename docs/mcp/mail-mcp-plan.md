# Mail MCP Plan

## Page Scope

This covers `/inbox`, `/settings/email`, and the unified email APIs:

- `GET /api/emails`
- `POST /api/emails`
- `POST /api/emails/batch`
- `GET /api/email-accounts`

The agent must be able to read unified inbox messages, understand which mailbox they came from, draft replies, send replies, and perform mailbox actions.

## Existing System Notes

- Mailboxes are stored in `EmailAccount`.
- Inbox reads use IMAP through `src/lib/imap.ts`.
- Sending uses `sendRealEmail` in `src/lib/mailer.ts`.
- The daily send quota is no longer enforced; `sentToday` is reporting only.
- Each mailbox belongs to one `userId`.

## MCP Resources

- `britcrm://mail/accounts`: connected active sender/IMAP accounts for the current user.
- `britcrm://mail/inbox?accountId=&mailbox=`: recent inbox snapshot.
- `britcrm://mail/message/{uid}?accountId=&mailbox=`: full message body and metadata.
- `britcrm://docs/mail`: this document.

## MCP Tools

### `mail.list_accounts`

Input: none.

Returns active `EmailAccount` records visible to the user: `id`, `email`, `host`, `imapHost`, `isActive`, `sentToday`.

### `mail.search_messages`

Input:

```json
{
  "accountId": "optional",
  "mailbox": "INBOX",
  "query": "optional text",
  "limit": 50
}
```

Returns normalized message summaries. The tool should search the first working inbox when no account is selected.

### `mail.read_message`

Input: `accountId`, `mailbox`, `uid`.

Returns subject, from, to, date, text, html, attachments metadata, and reply headers if available.

### `mail.draft_reply`

Input: `accountId`, `uid`, `mailbox`, `instructions`, optional `tone`.

Returns a reply draft only. It must not send.

### `mail.send_email`

Input: `accountId`, `to`, `subject`, `htmlBody`, optional `senderName`, optional `replyToUid`.

Sends via `sendRealEmail`. If `replyToUid` is present, include original subject/thread headers when available.

### `mail.batch_action`

Input: `accountId`, `mailbox`, `uids`, `action`.

Actions: `archive`, `delete`, `markRead`, `markUnread`, `move`.

## Agent Workflow

1. Read accounts.
2. Search or read inbox.
3. Classify message intent: lead, support, billing, meeting, spam, newsletter.
4. Draft a reply.
5. For sends, require explicit agent policy approval or user confirmation depending on deployment mode.
6. Send and log an interaction against matching lead/customer when possible.

## Safety Requirements

- Never expose mailbox password fields.
- Always verify `EmailAccount.userId === context.userId`.
- Batch actions need max UID count validation.
- Sending should validate email syntax and reject empty subjects/bodies.
- Reply tools should include a dry-run mode for preview.

## Implementation Gaps

- Add thread-aware reply headers to `sendRealEmail`.
- Add attachment read/download tools only after malware and file-size controls exist.
- Add interaction logging after sends so lead/customer timelines stay updated.

