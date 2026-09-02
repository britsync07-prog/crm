# Leads MCP Plan

## Page Scope

This covers `/leads`, `/leads/new`, `/leads/[id]`, CSV upload, scraping jobs, AI scoring, categories, tags, and lead conversion.

## Existing System Notes

- Leads use the `Lead` model.
- Lead emails are globally unique in the current schema.
- CSV import logic exists in `src/app/team-actions.ts`.
- Lead creation, conversion, interaction logging, and status updates exist in `src/app/actions.ts`.
- Scraping endpoints exist under `/api/leads/scrape`.

## MCP Resources

- `britcrm://leads/list`: current user's leads.
- `britcrm://leads/{id}`: lead detail with interactions, tasks, deals, campaigns.
- `britcrm://leads/categories`: user's lead categories.
- `britcrm://docs/leads`: this document.

## MCP Tools

Implemented in `src/mcp/tools/leads.ts`:

- `leads.list`
- `leads.get`
- `leads.create`
- `leads.update`
- `leads.upload_csv`
- `leads.score`
- `leads.log_interaction`
- `leads.convert_to_customer`
- `leads.list_categories` (alias: `categories.list`)
- `leads.create_category` (alias: `categories.create`)

### `leads.list_categories`

Input: optional `search`.

Returns categories owned by the MCP user with `id`, `name`, `leadCount`, `createdAt`, and `updatedAt`. Use this to find category IDs (such as for "Talent") so the agent can assign leads to categories.

### `leads.create_category`

Input: `name`.

Creates a new lead category for the user or returns the existing category if one already exists with the same name.

### `leads.list`

Input: filters for status, categoryId, tag, company, source, search, created range.

Returns paginated leads with key fields: `id`, `name`, `email`, `company`, `status`, `aiScore`, `categoryId`, `createdAt`.

### `leads.create`

Input: name, email, phone, company, website, industry, location, source, status, categoryId, custom details.

Creates one lead for the current user, then optionally runs lead scoring.

### `leads.update`

Input: `leadId` plus editable fields.

Must verify ownership before updating.

### `leads.upload_csv`

Input: CSV text or file reference, optional `categoryId`, mapping config.

Parses leads, validates email, upserts current-user-owned records, skips invalid rows, and returns an import report.

Current implementation accepts CSV text directly as `csvText`, detects comma/semicolon/tab delimiters, validates category ownership, skips rows owned by another user because lead email is globally unique, and optionally runs AI categorization.

### `leads.score`

Input: `leadId`.

Runs the existing lead scoring agent and updates `aiScore`/`aiInsights`.

### `leads.log_interaction`

Input: `leadId`, `type`, `content`, optional sentiment.

Creates an interaction and can trigger lifecycle transitions.

### `leads.convert_to_customer`

Input: `leadId`.

Creates or links a customer record from the lead and triggers existing automation.

## Agent Workflow

1. List/search leads based on the user's business goal.
2. Create or import missing leads.
3. Score and categorize leads.
4. Select qualified leads for outreach.
5. Log every email, call, meeting, or note.
6. Convert leads only after a clear qualification signal.

## Safety Requirements

- Never update or export leads not owned by `context.userId`.
- CSV upload must return skipped rows and reasons.
- Lead conversion should be idempotent by email.
- Bulk updates must support preview before commit.

## Implementation Gaps

- Add explicit API routes for lead CRUD instead of relying only on server actions.
- Add duplicate-resolution rules because `Lead.email` is currently globally unique.
