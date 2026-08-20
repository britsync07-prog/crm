# Admin And Pricing MCP Plan

## Page Scope

This covers admin pages for pricing plans, discounts/events/offers, trials, users, organizations, system email, and operational visibility.

## Existing System Notes

- Admin actions live mainly in `src/app/admin/admin-actions.ts`.
- Pricing logic lives in `src/lib/pricing.ts`.
- Admin can manage pricing plans, discount events, trial days, users, organizations, and system email profiles.
- Public pricing reads from `/api/pricing`.

## MCP Resources

- `britcrm://admin/pricing/plans`
- `britcrm://admin/pricing/discounts`
- `britcrm://admin/users`
- `britcrm://admin/organizations`
- `britcrm://admin/system-email`
- `britcrm://admin/operations`
- `britcrm://docs/admin`

## MCP Tools

### `admin.pricing.list_plans`

Input: none.

Returns active and inactive plans with price, seat limit, trial days, Stripe price id, CTA, sort order, and features.

### `admin.pricing.upsert_plan`

Input: slug, name, description, monthly price, seat limit, features, trial days, Stripe price id, active/popular flags.

Creates or updates a plan.

### `admin.pricing.upsert_discount_event`

Input: title, description, discount percent, coupon code, start/end, appliesToPlanSlug, active flag.

Creates or updates a frontend-visible offer/event.

### `admin.users.search`

Input: query, role, status, plan.

Returns users and organization summary.

### `admin.users.update`

Input: userId plus role/status/subscription changes.

Requires admin role and writes audit logs.

### `admin.system_email.update_profile`

Input: transactional/newsletter profile SMTP settings.

Updates system email sender configuration.

### `admin.operations.snapshot`

Input: none.

Returns counts, configuration status, and recent activity logs.

## Agent Workflow

1. Confirm admin context.
2. Read current plans/discounts before changes.
3. Preview frontend-visible pricing impact.
4. Apply change only with `confirm: true`.
5. Write activity log.
6. Revalidate affected public pages or trigger cache invalidation.

## Safety Requirements

- Every tool in this file requires `context.role === "ADMIN"`.
- Password fields and SMTP secrets must never be returned in resources.
- Pricing changes must validate positive prices, valid dates, valid discount percentage, and unique slugs.
- User deletion must require a separate destructive confirmation.
- Admin tools must log actor, target, and changed fields.

## Implementation Gaps

- Admin/pricing MCP tools are implemented in `src/mcp/tools/admin.ts`.
- MCP admin writes currently use the existing `ActivityLog` table with `MCP_ADMIN_*` actions.
- Add preview endpoint for public pricing cards.
- Add rollback helper for pricing/discount updates.

## Implemented Tools

- `admin.pricing.list_plans`
- `admin.pricing.upsert_plan`
- `admin.pricing.upsert_discount_event`
- `admin.users.search`
- `admin.users.update`
- `admin.system_email.update_profile`
- `admin.operations.snapshot`
