# Billing MCP Plan

## Page Scope

This covers `/billing`, `/billing/clients`, `/billing/invoices`, `/billing/quotations`, invoice creation, quote creation, payment status, discount, advance paid, and balance due.

## Current Requirement

The billing MCP tools must preserve the BritLedger-style workflow:

- Create/select a billing client.
- Add invoice or quotation line items.
- Allow direct line amount editing as well as quantity/unit-cost editing.
- Calculate subtotal, VAT, discount, total, advance paid, and balance due.
- Update payment status and track paid/unpaid balances.

## MCP Resources

- `britcrm://billing/clients`
- `britcrm://billing/clients/{id}`
- `britcrm://billing/invoices`
- `britcrm://billing/invoices/{id}`
- `britcrm://billing/quotations`
- `britcrm://docs/billing`

## MCP Tools

### `billing.list_clients`

Input: optional search.

Returns billing clients and balance summary.

### `billing.create_client`

Input: name, email, company, phone, address, tax details.

Creates a billing client under the current user.

### `billing.create_invoice`

Input: clientId, invoice number, issue date, due date, currency, line items, VAT, discount, advance paid, notes, status.

Returns calculated totals and saved invoice.

### `billing.update_invoice`

Input: invoiceId plus changed fields.

Recalculates totals server-side and saves.

### `billing.record_payment`

Input: invoiceId, amount, paidAt, method, notes.

Updates advance paid/balance due and payment status.

### `billing.create_quotation`

Input: clientId, quotation number, issue date, valid until, currency, line items, discount, notes.

Creates a quotation with totals.

### `billing.convert_quote_to_invoice`

Input: quotationId, confirm.

Creates an invoice from a quotation.

## Agent Workflow

1. Search or create the billing client.
2. Build invoice/quotation line items from the user's instruction.
3. Calculate totals server-side.
4. Present a preview before creating or sending.
5. Save invoice/quotation.
6. Record payments and update balance due.

## Safety Requirements

- All money calculations must be server-side and use integer minor units where possible.
- Agent must not mark an invoice paid without explicit payment evidence or user confirmation.
- Edits must verify invoice/client ownership.
- Currency must be explicit.
- Discounts and advance payments must never make balance negative unless overpayment is intentionally supported.

## Implementation Gaps

- MCP wrappers over the current BritLedger billing client are implemented in `src/mcp/tools/billing.ts`.
- MCP billing calls can use `BRITCRM_MCP_USER_ID` and `BRITCRM_MCP_USER_EMAIL` as the BritLedger auth context when no browser session exists.
- Add payment transaction model if not already present.
- Add PDF generation tools after invoice CRUD is stable.

## Implemented Tools

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
