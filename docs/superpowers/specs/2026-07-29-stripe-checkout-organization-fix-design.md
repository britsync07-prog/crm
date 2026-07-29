# Design: Stripe Checkout Organization Auto-Initialization

This document outlines the design and changes required to resolve silent failures when trying to upgrade to a paid Stripe subscription when the user's organization is not initialized.

## Purpose & Requirements
1. **Dynamic Organization Initialization**: When requesting a Stripe checkout session or billing portal, auto-initialize the user's organization and organization member records if they do not already exist.
2. **Robust Front-End Feedback**: Alert the user if the Stripe checkout request fails instead of failing silently.

## Proposed Changes

### 1. Stripe Checkout API Route
**File**: [create-checkout/route.ts](file:///home/saimon/job/crm/CRMsaas/src/app/api/stripe/create-checkout/route.ts)
- Replace the strict `!member` verification error check with an auto-initialization block that creates the `Organization` and `OrganizationMember` if none exist for the user.

### 2. Front-End Subscription Checkout Action
**File**: [page.tsx](file:///home/saimon/job/crm/CRMsaas/src/app/settings/billing/page.tsx)
- Modify `handleSubscribe()` to check for `data.url` and trigger an alert/toast notification when the API returns an error or fails.

## Verification Strategy
- Perform a Next.js production build and check for type compilation.
