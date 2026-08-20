import crypto from "crypto";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prisma } from "../../lib/db.js";
import {
  ensurePricingTables,
  getPricingOffers,
  getPricingPlans,
  getPublicPricingPlans,
} from "../../lib/pricing.js";
import { getMcpContext } from "../context.js";

function jsonResult(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

async function runTool<T>(operation: () => Promise<T>) {
  try {
    const data = await operation();
    return jsonResult({ success: true, data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResult({ success: false, data: null, error: message });
  }
}

async function requireMcpAdmin() {
  const context = await getMcpContext();
  if (context.role !== "ADMIN") {
    throw new Error("Admin MCP tools require an ADMIN user context.");
  }
  return context;
}

async function logAdminAction(userId: string, action: string, details: string) {
  await prisma.activityLog.create({ data: { userId, action, details } });
}

function normalizeSlug(value: string) {
  const slug = value.trim().toLowerCase();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    throw new Error("Plan slug must use lowercase letters, numbers, and dashes.");
  }
  return slug;
}

function parseDate(value: string, label: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} must be a valid date or ISO datetime.`);
  return date;
}

async function ensureSystemEmailProfileTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SystemEmailProfile" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "profile" TEXT NOT NULL UNIQUE,
      "host" TEXT,
      "port" INTEGER NOT NULL DEFAULT 587,
      "username" TEXT,
      "password" TEXT,
      "fromEmail" TEXT,
      "fromName" TEXT,
      "secureMode" TEXT NOT NULL DEFAULT 'STARTTLS',
      "isEnabled" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

type SystemEmailProfileRow = {
  id: string;
  profile: string;
  host: string | null;
  port: number;
  username: string | null;
  password: string | null;
  fromEmail: string | null;
  fromName: string | null;
  secureMode: string;
  isEnabled: boolean | number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function redactSystemEmailProfile(row: SystemEmailProfileRow | null, profile: "transactional" | "newsletter") {
  return {
    profile,
    host: row?.host || "",
    port: row?.port || 587,
    username: row?.username || "",
    fromEmail: row?.fromEmail || "",
    fromName: row?.fromName || "BritCRM",
    secureMode: row?.secureMode || "STARTTLS",
    isEnabled: Boolean(row?.isEnabled),
    hasPassword: Boolean(row?.password || process.env.SYSTEM_SMTP_PASSWORD),
    createdAt: row?.createdAt || null,
    updatedAt: row?.updatedAt || null,
  };
}

export function registerAdminTools(server: McpServer) {
  server.registerTool(
    "admin.pricing.list_plans",
    {
      title: "List Admin Pricing Plans",
      description: "Admin-only view of all pricing plans, discount events, and public pricing preview used by the frontend pricing page.",
      inputSchema: {
        includePublicPreview: z.boolean().default(true),
      },
    },
    async ({ includePublicPreview }) =>
      runTool(async () => {
        await requireMcpAdmin();
        const [plans, offers, publicPreview] = await Promise.all([
          getPricingPlans(),
          getPricingOffers(),
          includePublicPreview ? getPublicPricingPlans() : Promise.resolve([]),
        ]);
        return { plans, offers, publicPreview };
      })
  );

  server.registerTool(
    "admin.pricing.upsert_plan",
    {
      title: "Create Or Update Pricing Plan",
      description: "Admin-only pricing plan create/update. Use confirm=false first to preview public pricing impact; confirm=true applies the change.",
      inputSchema: {
        id: z.string().optional(),
        slug: z.string().min(1),
        name: z.string().trim().min(1),
        description: z.string().default(""),
        monthlyPriceCents: z.number().int().min(0).nullable().default(null),
        seatLimit: z.number().int().min(1).max(10000).nullable().default(null),
        features: z.array(z.string().trim().min(1)).default([]),
        stripePriceId: z.string().optional(),
        isActive: z.boolean().default(true),
        isPopular: z.boolean().default(false),
        sortOrder: z.number().int().min(0).max(9999).default(0),
        trialDays: z.number().int().min(0).max(365).default(14),
        ctaLabel: z.string().optional(),
        confirm: z.boolean().default(false),
      },
    },
    async (args) =>
      runTool(async () => {
        const context = await requireMcpAdmin();
        const slug = normalizeSlug(args.slug);
        const payload = {
          ...args,
          slug,
          description: args.description.trim(),
          stripePriceId: args.stripePriceId?.trim() || null,
          ctaLabel: args.ctaLabel?.trim() || null,
          features: args.features.map((item) => item.trim()).filter(Boolean),
        };

        if (!args.confirm) {
          return { previewOnly: true, action: args.id ? "update_plan" : "create_plan", payload };
        }

        await ensurePricingTables();
        const existing = args.id
          ? await prisma.$queryRawUnsafe<{ id: string }[]>(`SELECT "id" FROM "PricingPlan" WHERE "id" = ? LIMIT 1`, args.id)
          : await prisma.$queryRawUnsafe<{ id: string }[]>(`SELECT "id" FROM "PricingPlan" WHERE "slug" = ? LIMIT 1`, slug);
        const targetId = args.id || existing[0]?.id || crypto.randomUUID();

        if (existing[0]) {
          await prisma.$executeRawUnsafe(
            `UPDATE "PricingPlan"
             SET "slug" = ?, "name" = ?, "description" = ?, "monthlyPriceCents" = ?, "seatLimit" = ?, "featuresJson" = ?,
                 "stripePriceId" = ?, "isActive" = ?, "isPopular" = ?, "sortOrder" = ?, "trialDays" = ?, "ctaLabel" = ?, "updatedAt" = CURRENT_TIMESTAMP
             WHERE "id" = ?`,
            slug,
            payload.name,
            payload.description,
            payload.monthlyPriceCents,
            payload.seatLimit,
            JSON.stringify(payload.features),
            payload.stripePriceId,
            payload.isActive ? 1 : 0,
            payload.isPopular ? 1 : 0,
            payload.sortOrder,
            payload.trialDays,
            payload.ctaLabel,
            targetId
          );
        } else {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "PricingPlan"
             ("id", "slug", "name", "description", "monthlyPriceCents", "seatLimit", "featuresJson", "stripePriceId", "isActive", "isPopular", "sortOrder", "trialDays", "ctaLabel", "createdAt", "updatedAt")
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            targetId,
            slug,
            payload.name,
            payload.description,
            payload.monthlyPriceCents,
            payload.seatLimit,
            JSON.stringify(payload.features),
            payload.stripePriceId,
            payload.isActive ? 1 : 0,
            payload.isPopular ? 1 : 0,
            payload.sortOrder,
            payload.trialDays,
            payload.ctaLabel
          );
        }

        await logAdminAction(context.userId, "MCP_ADMIN_UPSERT_PRICING_PLAN", `Upserted pricing plan ${slug}`);
        const plans = await getPricingPlans();
        const publicPreview = await getPublicPricingPlans();
        return { previewOnly: false, plan: plans.find((plan) => plan.slug === slug), publicPreview };
      })
  );

  server.registerTool(
    "admin.pricing.upsert_discount_event",
    {
      title: "Create Or Update Discount Event",
      description: "Admin-only frontend-visible pricing offer/event create/update. Use confirm=false first to preview the event; confirm=true applies it.",
      inputSchema: {
        id: z.string().optional(),
        title: z.string().trim().min(1),
        description: z.string().default(""),
        discountPercent: z.number().int().min(1).max(95),
        couponCode: z.string().optional(),
        startsAt: z.string().min(1),
        endsAt: z.string().min(1),
        appliesToPlanSlug: z.string().optional(),
        isActive: z.boolean().default(true),
        confirm: z.boolean().default(false),
      },
    },
    async (args) =>
      runTool(async () => {
        const context = await requireMcpAdmin();
        const startsAt = parseDate(args.startsAt, "Offer start");
        const endsAt = parseDate(args.endsAt, "Offer end");
        if (startsAt >= endsAt) throw new Error("Offer end date must be after start date.");

        const payload = {
          id: args.id,
          title: args.title.trim(),
          description: args.description.trim(),
          discountPercent: args.discountPercent,
          couponCode: args.couponCode?.trim() || null,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          appliesToPlanSlug: args.appliesToPlanSlug ? normalizeSlug(args.appliesToPlanSlug) : null,
          isActive: args.isActive,
        };

        if (!args.confirm) {
          return { previewOnly: true, action: args.id ? "update_discount_event" : "create_discount_event", payload };
        }

        await ensurePricingTables();
        if (payload.appliesToPlanSlug) {
          const plan = await prisma.$queryRawUnsafe<{ id: string }[]>(
            `SELECT "id" FROM "PricingPlan" WHERE "slug" = ? LIMIT 1`,
            payload.appliesToPlanSlug
          );
          if (!plan[0]) throw new Error(`No pricing plan exists for slug "${payload.appliesToPlanSlug}".`);
        }

        const existing = args.id
          ? await prisma.$queryRawUnsafe<{ id: string }[]>(`SELECT "id" FROM "PricingOffer" WHERE "id" = ? LIMIT 1`, args.id)
          : [];
        const targetId = args.id || crypto.randomUUID();

        if (existing[0]) {
          await prisma.$executeRawUnsafe(
            `UPDATE "PricingOffer"
             SET "title" = ?, "description" = ?, "discountPercent" = ?, "couponCode" = ?, "startsAt" = ?, "endsAt" = ?,
                 "isActive" = ?, "appliesToPlanSlug" = ?, "updatedAt" = CURRENT_TIMESTAMP
             WHERE "id" = ?`,
            payload.title,
            payload.description,
            payload.discountPercent,
            payload.couponCode,
            payload.startsAt,
            payload.endsAt,
            payload.isActive ? 1 : 0,
            payload.appliesToPlanSlug,
            targetId
          );
        } else {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "PricingOffer"
             ("id", "title", "description", "discountPercent", "couponCode", "startsAt", "endsAt", "isActive", "appliesToPlanSlug", "createdAt", "updatedAt")
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            targetId,
            payload.title,
            payload.description,
            payload.discountPercent,
            payload.couponCode,
            payload.startsAt,
            payload.endsAt,
            payload.isActive ? 1 : 0,
            payload.appliesToPlanSlug
          );
        }

        await logAdminAction(context.userId, "MCP_ADMIN_UPSERT_PRICING_OFFER", `Upserted pricing offer ${payload.title}`);
        const [offers, publicPreview] = await Promise.all([getPricingOffers(), getPublicPricingPlans()]);
        return { previewOnly: false, offer: offers.find((offer) => offer.id === targetId), publicPreview };
      })
  );

  server.registerTool(
    "admin.users.search",
    {
      title: "Search Admin Users",
      description: "Admin-only user search with role, status, and organization plan filters. Returns user and organization summary without secrets.",
      inputSchema: {
        query: z.string().default(""),
        role: z.string().optional(),
        status: z.string().optional(),
        plan: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
      },
    },
    async ({ query, role, status, plan, page, pageSize }) =>
      runTool(async () => {
        await requireMcpAdmin();
        const search = query.trim();
        const where = {
          ...(search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] } : {}),
          ...(role ? { role } : {}),
          ...(status ? { status } : {}),
          ...(plan ? { ownedOrganization: { plan } } : {}),
        };
        const [users, total] = await Promise.all([
          prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              isVerified: true,
              newsletterOptedIn: true,
              createdAt: true,
              updatedAt: true,
              ownedOrganization: { select: { id: true, name: true, plan: true, seatLimit: true, subscriptionStatus: true } },
              memberProfile: { select: { organization: { select: { id: true, name: true, plan: true, subscriptionStatus: true } } } },
            },
          }),
          prisma.user.count({ where }),
        ]);
        return { users, total, page, totalPages: Math.ceil(total / pageSize) };
      })
  );

  server.registerTool(
    "admin.users.update",
    {
      title: "Update Admin User",
      description: "Admin-only user role/status/subscription update. Requires confirm=true and blocks self-demotion or self-suspension.",
      inputSchema: {
        userId: z.string().min(1),
        role: z.enum(["USER", "ADMIN", "EMPLOYEE"]).optional(),
        status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
        plan: z.enum(["free", "personal", "business", "enterprise"]).optional(),
        subscriptionStatus: z.enum(["free", "active", "trialing", "past_due", "canceled", "unpaid"]).optional(),
        seatLimit: z.number().int().min(1).max(10000).optional(),
        confirm: z.boolean().default(false),
      },
    },
    async ({ userId, role, status, plan, subscriptionStatus, seatLimit, confirm }) =>
      runTool(async () => {
        const context = await requireMcpAdmin();
        if (userId === context.userId && role && role !== "ADMIN") throw new Error("Cannot demote the current MCP admin user.");
        if (userId === context.userId && status && status !== "ACTIVE") throw new Error("Cannot suspend or ban the current MCP admin user.");

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, role: true, status: true, ownedOrganization: { select: { id: true } } },
        });
        if (!user) throw new Error("User not found.");

        const preview = { userId, before: user, changes: { role, status, plan, subscriptionStatus, seatLimit } };
        if (!confirm) return { previewOnly: true, ...preview };

        if (role || status) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              ...(role ? { role } : {}),
              ...(status
                ? {
                    status,
                    bannedAt: status === "ACTIVE" ? null : new Date(),
                    bannedBy: status === "ACTIVE" ? null : context.userId,
                  }
                : {}),
            },
          });
        }

        if (plan || subscriptionStatus || seatLimit) {
          if (!user.ownedOrganization?.id) throw new Error("User has no owned organization to update subscription fields.");
          await prisma.organization.update({
            where: { id: user.ownedOrganization.id },
            data: {
              ...(plan ? { plan } : {}),
              ...(subscriptionStatus ? { subscriptionStatus } : {}),
              ...(seatLimit ? { seatLimit } : {}),
            },
          });
        }

        await logAdminAction(context.userId, "MCP_ADMIN_UPDATE_USER", `Updated user ${userId}`);
        return prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            ownedOrganization: { select: { id: true, name: true, plan: true, seatLimit: true, subscriptionStatus: true } },
          },
        });
      })
  );

  server.registerTool(
    "admin.system_email.update_profile",
    {
      title: "Update System Email Profile",
      description: "Admin-only SMTP profile update for transactional or newsletter email. Password is write-only and never returned.",
      inputSchema: {
        profile: z.enum(["transactional", "newsletter"]),
        host: z.string().trim().min(1),
        port: z.number().int().min(1).max(65535).default(587),
        username: z.string().trim().min(1),
        password: z.string().optional(),
        fromEmail: z.string().email(),
        fromName: z.string().trim().min(1).default("BritCRM"),
        secureMode: z.enum(["STARTTLS", "SSL/TLS", "NONE"]).default("STARTTLS"),
        isEnabled: z.boolean().default(true),
        confirm: z.boolean().default(false),
      },
    },
    async (args) =>
      runTool(async () => {
        const context = await requireMcpAdmin();
        const preview = { ...args, password: args.password ? "[redacted]" : undefined };
        if (!args.confirm) return { previewOnly: true, payload: preview };

        await ensureSystemEmailProfileTable();
        const existingRows = await prisma.$queryRawUnsafe<SystemEmailProfileRow[]>(
          `SELECT * FROM "SystemEmailProfile" WHERE "profile" = ? LIMIT 1`,
          args.profile
        );
        const existing = existingRows[0];
        const passwordToSave = args.password || existing?.password || process.env.SYSTEM_SMTP_PASSWORD || "";
        if (!passwordToSave) throw new Error("Password is required the first time this SMTP profile is saved.");

        if (existing) {
          await prisma.$executeRawUnsafe(
            `UPDATE "SystemEmailProfile"
             SET "host" = ?, "port" = ?, "username" = ?, "password" = ?, "fromEmail" = ?, "fromName" = ?, "secureMode" = ?, "isEnabled" = ?, "updatedAt" = CURRENT_TIMESTAMP
             WHERE "profile" = ?`,
            args.host,
            args.port,
            args.username,
            passwordToSave,
            args.fromEmail,
            args.fromName,
            args.secureMode,
            args.isEnabled ? 1 : 0,
            args.profile
          );
        } else {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "SystemEmailProfile" ("id", "profile", "host", "port", "username", "password", "fromEmail", "fromName", "secureMode", "isEnabled", "createdAt", "updatedAt")
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            crypto.randomUUID(),
            args.profile,
            args.host,
            args.port,
            args.username,
            passwordToSave,
            args.fromEmail,
            args.fromName,
            args.secureMode,
            args.isEnabled ? 1 : 0
          );
        }

        await logAdminAction(context.userId, "MCP_ADMIN_UPDATE_SYSTEM_EMAIL", `Updated ${args.profile} SMTP profile`);
        const savedRows = await prisma.$queryRawUnsafe<SystemEmailProfileRow[]>(
          `SELECT * FROM "SystemEmailProfile" WHERE "profile" = ? LIMIT 1`,
          args.profile
        );
        return redactSystemEmailProfile(savedRows[0] || null, args.profile);
      })
  );

  server.registerTool(
    "admin.operations.snapshot",
    {
      title: "Admin Operations Snapshot",
      description: "Admin-only operational snapshot with counts, config readiness, and recent activity logs for CRM health checks.",
      inputSchema: {},
    },
    async () =>
      runTool(async () => {
        await requireMcpAdmin();
        await ensureSystemEmailProfileTable();
        const [
          users,
          organizations,
          emailAccounts,
          activeMailboxes,
          campaigns,
          runningCampaigns,
          scrapeJobs,
          pendingScrapeJobs,
          forms,
          submissions,
          newsletters,
          recentActivity,
          systemEmailProfiles,
        ] = await Promise.all([
          prisma.user.count(),
          prisma.organization.count(),
          prisma.emailAccount.count(),
          prisma.emailAccount.count({ where: { isActive: true } }),
          prisma.campaign.count(),
          prisma.campaign.count({ where: { status: { in: ["Running", "ACTIVE", "Active"] } } }),
          prisma.scrapeJob.count(),
          prisma.scrapeJob.count({ where: { status: { in: ["Pending", "Running"] } } }),
          prisma.form.count(),
          prisma.formSubmission.count(),
          prisma.newsletter.count(),
          prisma.activityLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 20,
            select: { id: true, action: true, details: true, createdAt: true, user: { select: { email: true, name: true } } },
          }),
          prisma.$queryRawUnsafe<SystemEmailProfileRow[]>(`SELECT * FROM "SystemEmailProfile"`),
        ]);

        const profileReady = (profile: "transactional" | "newsletter") => {
          const saved = systemEmailProfiles.find((item) => item.profile === profile);
          if (saved?.isEnabled && saved.host && saved.username && saved.password) return true;
          return Boolean(process.env.SYSTEM_SMTP_HOST && process.env.SYSTEM_SMTP_PASSWORD);
        };

        return {
          counts: {
            users,
            organizations,
            emailAccounts,
            activeMailboxes,
            campaigns,
            runningCampaigns,
            scrapeJobs,
            pendingScrapeJobs,
            forms,
            submissions,
            newsletters,
          },
          config: {
            database: true,
            transactionalEmail: profileReady("transactional"),
            newsletterEmail: profileReady("newsletter"),
            stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
            jwt: Boolean(process.env.JWT_SECRET),
            appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || null,
          },
          systemEmailProfiles: systemEmailProfiles.map((row) =>
            redactSystemEmailProfile(row, row.profile === "newsletter" ? "newsletter" : "transactional")
          ),
          recentActivity,
        };
      })
  );
}
