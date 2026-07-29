# Stripe Checkout Organization Auto-Initialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users without pre-existing organizations to successfully initiate Stripe checkout by dynamically creating their organization/membership records, and notify the user on failure instead of failing silently.

**Architecture:**
1. Update `src/app/api/stripe/create-checkout/route.ts` to dynamically create `Organization` and `OrganizationMember` if the current user has none.
2. Update `src/app/settings/billing/page.tsx` to handle error responses from the subscription endpoint.

**Tech Stack:** Next.js, Prisma, Stripe

---

### Task 1: Auto-Initialize Organization on Checkout

**Files:**
- Modify: `src/app/api/stripe/create-checkout/route.ts`

- [ ] **Step 1: Replace strict check with dynamic creation logic**
  Modify [route.ts](file:///home/saimon/job/crm/CRMsaas/src/app/api/stripe/create-checkout/route.ts#L22-L29):
  
  ```typescript
  // Before
  const member = await prisma.organizationMember.findFirst({
    where: { userId: session.id, role: "admin" },
    include: { organization: true },
  });

  if (!member) {
    return NextResponse.json({ error: "Only org admins can manage billing" }, { status: 403 });
  }

  // After
  let member = await prisma.organizationMember.findFirst({
    where: { userId: session.id, role: "admin" },
    include: { organization: true },
  });

  if (!member) {
    let orgId = user.organizationId;
    let org;

    if (!orgId) {
      org = await prisma.organization.create({
        data: {
          name: `${user.name || "My"}'s Organization`,
          ownerId: user.id,
          plan: "free",
          seatLimit: 1,
        },
      });
      orgId = org.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: orgId },
      });
    } else {
      org = await prisma.organization.findUnique({ where: { id: orgId } });
    }

    member = await prisma.organizationMember.create({
      data: {
        organizationId: orgId!,
        userId: user.id,
        email: user.email,
        role: "admin",
        status: "active",
        invitedById: user.id,
        lastActive: new Date(),
      },
      include: { organization: true },
    });
  }
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add src/app/api/stripe/create-checkout/route.ts
  git commit -m "fix: dynamically auto-create organization and member on stripe checkout if missing"
  ```

---

### Task 2: Robust Front-End Checkout Feedback

**Files:**
- Modify: `src/app/settings/billing/page.tsx`

- [ ] **Step 1: Alert errors in handleSubscribe**
  Modify [page.tsx](file:///home/saimon/job/crm/CRMsaas/src/app/settings/billing/page.tsx#L35-L49):
  
  ```typescript
  // Before
  async function handleSubscribe(planSlug: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planSlug }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  // After
  async function handleSubscribe(planSlug: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planSlug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to initiate subscription checkout.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    }
    setLoading(false);
  }
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add src/app/settings/billing/page.tsx
  git commit -m "fix: alert user on stripe checkout session creation failure"
  ```

---

### Task 3: Build Verification

- [ ] **Step 1: Verify production build compiles**
  Run: `npm run build`
