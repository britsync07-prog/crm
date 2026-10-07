import { prisma } from "@/lib/db";
import crypto from "crypto";

export interface ReferralLinkRecord {
  id: string;
  code: string;
  agencyName: string;
  targetUrl: string;
  notes: string | null;
  isActive: boolean;
  visitsCount: number;
  uniqueVisitsCount: number;
  signupsCount: number;
  purchasesCount: number;
  totalRevenue: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  conversionRateSignup?: number;
  conversionRatePurchase?: number;
}

export interface ReferredClientRecord {
  id: string;
  userId: string | null;
  name: string | null;
  email: string | null;
  plan: string | null;
  subscriptionStatus: string | null;
  signupDate: string;
  totalPaid: number;
  purchasesCount: number;
}

export interface ReferralVisitDetail {
  id: string;
  visitorId: string;
  ip: string | null;
  userAgent: string | null;
  referer: string | null;
  landingPath: string | null;
  createdAt: string;
}

export interface ReferralOverviewStats {
  totalAgencies: number;
  activeAgencies: number;
  totalVisits: number;
  uniqueVisits: number;
  totalSignups: number;
  totalPurchases: number;
  totalRevenue: number;
  overallSignupRate: number; // % of unique visits that signed up
  overallPurchaseRate: number; // % of signups that purchased
}

/**
 * Ensures referral tables and User.referralLinkId column exist at runtime
 */
export async function ensureReferralTables() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ReferralLink" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL COLLATE NOCASE,
        "agencyName" TEXT NOT NULL,
        "targetUrl" TEXT NOT NULL DEFAULT '/',
        "notes" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "visitsCount" INTEGER NOT NULL DEFAULT 0,
        "uniqueVisitsCount" INTEGER NOT NULL DEFAULT 0,
        "signupsCount" INTEGER NOT NULL DEFAULT 0,
        "purchasesCount" INTEGER NOT NULL DEFAULT 0,
        "totalRevenue" REAL NOT NULL DEFAULT 0.0,
        "createdBy" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ReferralLink_code_key" ON "ReferralLink"("code");`).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ReferralVisit" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "referralLinkId" TEXT NOT NULL,
        "visitorId" TEXT NOT NULL,
        "ip" TEXT,
        "userAgent" TEXT,
        "referer" TEXT,
        "landingPath" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ReferralVisit_referralLinkId_fkey" FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ReferralVisit_referralLinkId_idx" ON "ReferralVisit"("referralLinkId");`).catch(() => {});
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ReferralVisit_visitorId_idx" ON "ReferralVisit"("visitorId");`).catch(() => {});
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ReferralVisit_createdAt_idx" ON "ReferralVisit"("createdAt");`).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ReferralConversion" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "referralLinkId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "userId" TEXT,
        "userEmail" TEXT,
        "organizationId" TEXT,
        "plan" TEXT,
        "amount" REAL NOT NULL DEFAULT 0.0,
        "currency" TEXT NOT NULL DEFAULT 'USD',
        "stripeSessionId" TEXT,
        "metadataJson" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ReferralConversion_referralLinkId_fkey" FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ReferralConversion_referralLinkId_idx" ON "ReferralConversion"("referralLinkId");`).catch(() => {});
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ReferralConversion_userId_idx" ON "ReferralConversion"("userId");`).catch(() => {});
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ReferralConversion_type_idx" ON "ReferralConversion"("type");`).catch(() => {});
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ReferralConversion_createdAt_idx" ON "ReferralConversion"("createdAt");`).catch(() => {});

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "referralLinkId" TEXT;`);
    } catch {
      // already exists
    }
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "User_referralLinkId_idx" ON "User"("referralLinkId");`);
    } catch {
      // index already exists
    }
  } catch (err) {
    console.error("[Referral] ensureReferralTables error:", err);
  }
}

/**
 * Format and sanitize referral code
 */
export function sanitizeReferralCode(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Find active referral link by code
 */
export async function getReferralLinkByCode(code: string): Promise<ReferralLinkRecord | null> {
  await ensureReferralTables();
  const sanitized = sanitizeReferralCode(code);
  if (!sanitized) return null;

  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "ReferralLink" WHERE LOWER("code") = LOWER(?) LIMIT 1`,
      sanitized
    );
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      code: r.code,
      agencyName: r.agencyName,
      targetUrl: r.targetUrl || "/",
      notes: r.notes,
      isActive: Boolean(r.isActive),
      visitsCount: Number(r.visitsCount || 0),
      uniqueVisitsCount: Number(r.uniqueVisitsCount || 0),
      signupsCount: Number(r.signupsCount || 0),
      purchasesCount: Number(r.purchasesCount || 0),
      totalRevenue: Number(r.totalRevenue || 0),
      createdBy: r.createdBy,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
    };
  } catch (err) {
    console.error("[Referral] getReferralLinkByCode error:", err);
    return null;
  }
}

/**
 * Record a visit for a referral link
 */
export async function recordReferralVisit(params: {
  code: string;
  visitorId: string;
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
  landingPath?: string | null;
}): Promise<{ success: boolean; link?: ReferralLinkRecord; isUnique?: boolean }> {
  await ensureReferralTables();
  const link = await getReferralLinkByCode(params.code);
  if (!link || !link.isActive) {
    return { success: false };
  }

  try {
    // Check if this visitor has visited this link before
    const previousVisits = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM "ReferralVisit" WHERE "referralLinkId" = ? AND "visitorId" = ? LIMIT 1`,
      link.id,
      params.visitorId
    );

    const isUnique = !previousVisits || previousVisits.length === 0;
    const visitId = crypto.randomUUID();

    // Insert visit log
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ReferralVisit" ("id", "referralLinkId", "visitorId", "ip", "userAgent", "referer", "landingPath", "createdAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      visitId,
      link.id,
      params.visitorId,
      params.ip || null,
      params.userAgent ? params.userAgent.slice(0, 500) : null,
      params.referer ? params.referer.slice(0, 500) : null,
      params.landingPath || "/"
    );

    // Update counters on ReferralLink
    if (isUnique) {
      await prisma.$executeRawUnsafe(
        `UPDATE "ReferralLink" 
         SET "visitsCount" = "visitsCount" + 1, "uniqueVisitsCount" = "uniqueVisitsCount" + 1, "updatedAt" = CURRENT_TIMESTAMP 
         WHERE "id" = ?`,
        link.id
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "ReferralLink" 
         SET "visitsCount" = "visitsCount" + 1, "updatedAt" = CURRENT_TIMESTAMP 
         WHERE "id" = ?`,
        link.id
      );
    }

    return { success: true, link, isUnique };
  } catch (err) {
    console.error("[Referral] recordReferralVisit error:", err);
    return { success: false };
  }
}

/**
 * Record a signup conversion
 */
export async function recordSignupConversion(params: {
  referralCodeOrId: string;
  userId: string;
  userEmail: string;
}): Promise<boolean> {
  await ensureReferralTables();
  try {
    // Look up link by ID or code
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "ReferralLink" WHERE "id" = ? OR LOWER("code") = LOWER(?) LIMIT 1`,
      params.referralCodeOrId,
      params.referralCodeOrId
    );

    if (!rows || rows.length === 0) return false;
    const link = rows[0];

    // Check if user is already linked or conversion recorded
    const existingConversion = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM "ReferralConversion" WHERE "userId" = ? AND "type" = 'SIGNUP' LIMIT 1`,
      params.userId
    );

    if (existingConversion && existingConversion.length > 0) {
      return false; // already recorded
    }

    // Set referralLinkId on User
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "referralLinkId" = ? WHERE "id" = ?`,
      link.id,
      params.userId
    );

    // Insert conversion
    const conversionId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ReferralConversion" ("id", "referralLinkId", "type", "userId", "userEmail", "amount", "currency", "createdAt")
       VALUES (?, ?, 'SIGNUP', ?, ?, 0.0, 'USD', CURRENT_TIMESTAMP)`,
      conversionId,
      link.id,
      params.userId,
      params.userEmail
    );

    // Increment signupsCount on ReferralLink
    await prisma.$executeRawUnsafe(
      `UPDATE "ReferralLink" 
       SET "signupsCount" = "signupsCount" + 1, "updatedAt" = CURRENT_TIMESTAMP 
       WHERE "id" = ?`,
      link.id
    );

    return true;
  } catch (err) {
    console.error("[Referral] recordSignupConversion error:", err);
    return false;
  }
}

/**
 * Record a purchase / subscription conversion
 */
export async function recordPurchaseConversion(params: {
  referralLinkId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  organizationId?: string | null;
  plan?: string | null;
  amount: number;
  currency?: string;
  stripeSessionId?: string | null;
  metadata?: any;
}): Promise<boolean> {
  await ensureReferralTables();
  try {
    let linkId = params.referralLinkId;

    // If referralLinkId is not directly provided, find it from user or organization
    if (!linkId && params.userId) {
      const users = await prisma.$queryRawUnsafe<any[]>(
        `SELECT "referralLinkId" FROM "User" WHERE "id" = ? LIMIT 1`,
        params.userId
      );
      if (users && users.length > 0 && users[0].referralLinkId) {
        linkId = users[0].referralLinkId;
      }
    }

    if (!linkId && params.userEmail) {
      const users = await prisma.$queryRawUnsafe<any[]>(
        `SELECT "referralLinkId", "id" FROM "User" WHERE LOWER("email") = LOWER(?) LIMIT 1`,
        params.userEmail
      );
      if (users && users.length > 0 && users[0].referralLinkId) {
        linkId = users[0].referralLinkId;
      }
    }

    if (!linkId && params.organizationId) {
      const orgs = await prisma.organization.findUnique({
        where: { id: params.organizationId },
        select: { ownerId: true },
      });
      if (orgs?.ownerId) {
        const users = await prisma.$queryRawUnsafe<any[]>(
          `SELECT "referralLinkId" FROM "User" WHERE "id" = ? LIMIT 1`,
          orgs.ownerId
        );
        if (users && users.length > 0 && users[0].referralLinkId) {
          linkId = users[0].referralLinkId;
        }
      }
    }

    if (!linkId) {
      return false; // No referral association
    }

    // Verify referral link exists
    const links = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM "ReferralLink" WHERE "id" = ? LIMIT 1`,
      linkId
    );
    if (!links || links.length === 0) return false;

    // Idempotency check with stripeSessionId
    if (params.stripeSessionId) {
      const existing = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM "ReferralConversion" WHERE "stripeSessionId" = ? LIMIT 1`,
        params.stripeSessionId
      );
      if (existing && existing.length > 0) {
        return false; // already recorded
      }
    }

    const conversionId = crypto.randomUUID();
    const cleanAmount = Number(params.amount) || 0;
    const currency = (params.currency || "USD").toUpperCase();

    await prisma.$executeRawUnsafe(
      `INSERT INTO "ReferralConversion" 
       ("id", "referralLinkId", "type", "userId", "userEmail", "organizationId", "plan", "amount", "currency", "stripeSessionId", "metadataJson", "createdAt")
       VALUES (?, ?, 'PURCHASE', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      conversionId,
      linkId,
      params.userId || null,
      params.userEmail || null,
      params.organizationId || null,
      params.plan || "business",
      cleanAmount,
      currency,
      params.stripeSessionId || null,
      params.metadata ? JSON.stringify(params.metadata) : null
    );

    // Increment purchasesCount and totalRevenue on ReferralLink
    await prisma.$executeRawUnsafe(
      `UPDATE "ReferralLink" 
       SET "purchasesCount" = "purchasesCount" + 1, "totalRevenue" = "totalRevenue" + ?, "updatedAt" = CURRENT_TIMESTAMP 
       WHERE "id" = ?`,
      cleanAmount,
      linkId
    );

    return true;
  } catch (err) {
    console.error("[Referral] recordPurchaseConversion error:", err);
    return false;
  }
}

/**
 * Get aggregated overview statistics for admin
 */
export async function getAdminReferralOverview(): Promise<ReferralOverviewStats> {
  await ensureReferralTables();
  try {
    const totalAgenciesRes = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as count, 
              SUM(CASE WHEN "isActive" = 1 THEN 1 ELSE 0 END) as activeCount,
              SUM("visitsCount") as totalVisits,
              SUM("uniqueVisitsCount") as uniqueVisits,
              SUM("signupsCount") as totalSignups,
              SUM("purchasesCount") as totalPurchases,
              SUM("totalRevenue") as totalRevenue
       FROM "ReferralLink"`
    );

    const row = totalAgenciesRes?.[0] || {};
    const totalAgencies = Number(row.count || 0);
    const activeAgencies = Number(row.activeCount || 0);
    const totalVisits = Number(row.totalVisits || 0);
    const uniqueVisits = Number(row.uniqueVisits || 0);
    const totalSignups = Number(row.totalSignups || 0);
    const totalPurchases = Number(row.totalPurchases || 0);
    const totalRevenue = Number(row.totalRevenue || 0);

    const overallSignupRate = uniqueVisits > 0 ? (totalSignups / uniqueVisits) * 100 : 0;
    const overallPurchaseRate = totalSignups > 0 ? (totalPurchases / totalSignups) * 100 : 0;

    return {
      totalAgencies,
      activeAgencies,
      totalVisits,
      uniqueVisits,
      totalSignups,
      totalPurchases,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      overallSignupRate: Math.round(overallSignupRate * 10) / 10,
      overallPurchaseRate: Math.round(overallPurchaseRate * 10) / 10,
    };
  } catch (err) {
    console.error("[Referral] getAdminReferralOverview error:", err);
    return {
      totalAgencies: 0,
      activeAgencies: 0,
      totalVisits: 0,
      uniqueVisits: 0,
      totalSignups: 0,
      totalPurchases: 0,
      totalRevenue: 0,
      overallSignupRate: 0,
      overallPurchaseRate: 0,
    };
  }
}

/**
 * Get all referral links with filters and sorting
 */
export async function getAllReferralLinks(filters?: {
  search?: string;
  status?: string;
  sortBy?: "visits" | "signups" | "purchases" | "revenue" | "newest" | "agency";
}): Promise<ReferralLinkRecord[]> {
  await ensureReferralTables();
  try {
    let sql = `SELECT * FROM "ReferralLink" WHERE 1=1`;
    const params: any[] = [];

    if (filters?.search?.trim()) {
      const q = `%${filters.search.trim().toLowerCase()}%`;
      sql += ` AND (LOWER("agencyName") LIKE ? OR LOWER("code") LIKE ?)`;
      params.push(q, q);
    }

    if (filters?.status === "active") {
      sql += ` AND "isActive" = 1`;
    } else if (filters?.status === "paused") {
      sql += ` AND "isActive" = 0`;
    }

    switch (filters?.sortBy) {
      case "visits":
        sql += ` ORDER BY "visitsCount" DESC, "createdAt" DESC`;
        break;
      case "signups":
        sql += ` ORDER BY "signupsCount" DESC, "createdAt" DESC`;
        break;
      case "purchases":
        sql += ` ORDER BY "purchasesCount" DESC, "createdAt" DESC`;
        break;
      case "revenue":
        sql += ` ORDER BY "totalRevenue" DESC, "createdAt" DESC`;
        break;
      case "agency":
        sql += ` ORDER BY "agencyName" ASC`;
        break;
      case "newest":
      default:
        sql += ` ORDER BY "createdAt" DESC`;
        break;
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);

    return rows.map((r) => {
      const visits = Number(r.visitsCount || 0);
      const uniqueVisits = Number(r.uniqueVisitsCount || 0);
      const signups = Number(r.signupsCount || 0);
      const purchases = Number(r.purchasesCount || 0);

      const baseVisits = uniqueVisits > 0 ? uniqueVisits : visits;
      const conversionRateSignup = baseVisits > 0 ? (signups / baseVisits) * 100 : 0;
      const conversionRatePurchase = signups > 0 ? (purchases / signups) * 100 : 0;

      return {
        id: r.id,
        code: r.code,
        agencyName: r.agencyName,
        targetUrl: r.targetUrl || "/",
        notes: r.notes,
        isActive: Boolean(r.isActive),
        visitsCount: visits,
        uniqueVisitsCount: uniqueVisits,
        signupsCount: signups,
        purchasesCount: purchases,
        totalRevenue: Math.round(Number(r.totalRevenue || 0) * 100) / 100,
        createdBy: r.createdBy,
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString(),
        conversionRateSignup: Math.round(conversionRateSignup * 10) / 10,
        conversionRatePurchase: Math.round(conversionRatePurchase * 10) / 10,
      };
    });
  } catch (err) {
    console.error("[Referral] getAllReferralLinks error:", err);
    return [];
  }
}

/**
 * Get detailed breakdown for a specific referral link (clients and recent visits)
 */
export async function getReferralLinkDetails(id: string): Promise<{
  link: ReferralLinkRecord | null;
  clients: ReferredClientRecord[];
  recentVisits: ReferralVisitDetail[];
}> {
  await ensureReferralTables();
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "ReferralLink" WHERE "id" = ? LIMIT 1`,
      id
    );

    if (!rows || rows.length === 0) {
      return { link: null, clients: [], recentVisits: [] };
    }

    const r = rows[0];
    const visits = Number(r.visitsCount || 0);
    const uniqueVisits = Number(r.uniqueVisitsCount || 0);
    const signups = Number(r.signupsCount || 0);
    const purchases = Number(r.purchasesCount || 0);
    const baseVisits = uniqueVisits > 0 ? uniqueVisits : visits;

    const link: ReferralLinkRecord = {
      id: r.id,
      code: r.code,
      agencyName: r.agencyName,
      targetUrl: r.targetUrl || "/",
      notes: r.notes,
      isActive: Boolean(r.isActive),
      visitsCount: visits,
      uniqueVisitsCount: uniqueVisits,
      signupsCount: signups,
      purchasesCount: purchases,
      totalRevenue: Math.round(Number(r.totalRevenue || 0) * 100) / 100,
      createdBy: r.createdBy,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
      conversionRateSignup: baseVisits > 0 ? Math.round((signups / baseVisits) * 1000) / 10 : 0,
      conversionRatePurchase: signups > 0 ? Math.round((purchases / signups) * 1000) / 10 : 0,
    };

    // Get all users associated with this referral link
    const userRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT u.id, u.name, u.email, u.createdAt, u.organizationId,
              o.plan as orgPlan, o.subscriptionStatus as orgSubStatus
       FROM "User" u
       LEFT JOIN "Organization" o ON u.organizationId = o.id
       WHERE u."referralLinkId" = ?
       ORDER BY u."createdAt" DESC`,
      id
    );

    // Get purchase conversions for these users
    const purchaseRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "userId", "userEmail", "amount", "plan"
       FROM "ReferralConversion"
       WHERE "referralLinkId" = ? AND "type" = 'PURCHASE'`,
      id
    );

    const clientMap = new Map<string, { totalPaid: number; purchasesCount: number }>();
    for (const p of purchaseRows) {
      const key = p.userId || p.userEmail || "unknown";
      const existing = clientMap.get(key) || { totalPaid: 0, purchasesCount: 0 };
      existing.totalPaid += Number(p.amount || 0);
      existing.purchasesCount += 1;
      clientMap.set(key, existing);
    }

    const clients: ReferredClientRecord[] = userRows.map((u) => {
      const pData = clientMap.get(u.id) || clientMap.get(u.email) || { totalPaid: 0, purchasesCount: 0 };
      return {
        id: u.id,
        userId: u.id,
        name: u.name,
        email: u.email,
        plan: u.orgPlan || "personal",
        subscriptionStatus: u.orgSubStatus || "active",
        signupDate: new Date(u.createdAt).toISOString(),
        totalPaid: Math.round(pData.totalPaid * 100) / 100,
        purchasesCount: pData.purchasesCount,
      };
    });

    // Get recent visits
    const visitRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "ReferralVisit" WHERE "referralLinkId" = ? ORDER BY "createdAt" DESC LIMIT 50`,
      id
    );

    const recentVisits: ReferralVisitDetail[] = visitRows.map((v) => ({
      id: v.id,
      visitorId: v.visitorId,
      ip: v.ip,
      userAgent: v.userAgent,
      referer: v.referer,
      landingPath: v.landingPath,
      createdAt: new Date(v.createdAt).toISOString(),
    }));

    return { link, clients, recentVisits };
  } catch (err) {
    console.error("[Referral] getReferralLinkDetails error:", err);
    return { link: null, clients: [], recentVisits: [] };
  }
}

/**
 * Create a new referral link
 */
export async function createReferralLink(data: {
  code: string;
  agencyName: string;
  targetUrl?: string;
  notes?: string;
  createdBy?: string;
}): Promise<{ success: boolean; link?: ReferralLinkRecord; error?: string }> {
  await ensureReferralTables();
  const code = sanitizeReferralCode(data.code);
  const agencyName = data.agencyName.trim();
  const targetUrl = (data.targetUrl?.trim() || "/").startsWith("/") ? data.targetUrl?.trim() || "/" : `/${data.targetUrl?.trim()}`;

  if (!code) {
    return { success: false, error: "Referral code is required (letters, numbers, dashes)." };
  }
  if (!agencyName) {
    return { success: false, error: "Agency name is required." };
  }

  // Check code uniqueness
  const existing = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id FROM "ReferralLink" WHERE LOWER("code") = LOWER(?) LIMIT 1`,
    code
  );
  if (existing && existing.length > 0) {
    return { success: false, error: `Referral code "${code}" is already in use.` };
  }

  const id = crypto.randomUUID();
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ReferralLink" 
       ("id", "code", "agencyName", "targetUrl", "notes", "isActive", "visitsCount", "uniqueVisitsCount", "signupsCount", "purchasesCount", "totalRevenue", "createdBy", "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?, 1, 0, 0, 0, 0, 0.0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      id,
      code,
      agencyName,
      targetUrl,
      data.notes?.trim() || null,
      data.createdBy || null
    );

    const link = await getReferralLinkByCode(code);
    return { success: true, link: link || undefined };
  } catch (err: any) {
    console.error("[Referral] createReferralLink error:", err);
    return { success: false, error: err.message || "Failed to create referral link." };
  }
}

/**
 * Update an existing referral link
 */
export async function updateReferralLink(
  id: string,
  data: {
    code?: string;
    agencyName?: string;
    targetUrl?: string;
    notes?: string;
    isActive?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  await ensureReferralTables();
  try {
    const existing = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "ReferralLink" WHERE "id" = ? LIMIT 1`,
      id
    );
    if (!existing || existing.length === 0) {
      return { success: false, error: "Referral link not found." };
    }

    let code = existing[0].code;
    if (data.code !== undefined) {
      const sanitized = sanitizeReferralCode(data.code);
      if (!sanitized) {
        return { success: false, error: "Referral code cannot be empty." };
      }
      // Check collision
      const checkOther = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM "ReferralLink" WHERE LOWER("code") = LOWER(?) AND "id" != ? LIMIT 1`,
        sanitized,
        id
      );
      if (checkOther && checkOther.length > 0) {
        return { success: false, error: `Code "${sanitized}" is already taken by another link.` };
      }
      code = sanitized;
    }

    const agencyName = data.agencyName !== undefined ? data.agencyName.trim() : existing[0].agencyName;
    const targetUrl = data.targetUrl !== undefined ? data.targetUrl.trim() : existing[0].targetUrl;
    const notes = data.notes !== undefined ? data.notes.trim() : existing[0].notes;
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : existing[0].isActive;

    await prisma.$executeRawUnsafe(
      `UPDATE "ReferralLink"
       SET "code" = ?, "agencyName" = ?, "targetUrl" = ?, "notes" = ?, "isActive" = ?, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = ?`,
      code,
      agencyName,
      targetUrl,
      notes,
      isActive,
      id
    );

    return { success: true };
  } catch (err: any) {
    console.error("[Referral] updateReferralLink error:", err);
    return { success: false, error: err.message || "Failed to update referral link." };
  }
}

/**
 * Delete a referral link
 */
export async function deleteReferralLink(id: string): Promise<{ success: boolean; error?: string }> {
  await ensureReferralTables();
  try {
    // Dissociate users first
    await prisma.$executeRawUnsafe(`UPDATE "User" SET "referralLinkId" = NULL WHERE "referralLinkId" = ?`, id);
    // Delete conversions and visits
    await prisma.$executeRawUnsafe(`DELETE FROM "ReferralConversion" WHERE "referralLinkId" = ?`, id);
    await prisma.$executeRawUnsafe(`DELETE FROM "ReferralVisit" WHERE "referralLinkId" = ?`, id);
    // Delete link
    await prisma.$executeRawUnsafe(`DELETE FROM "ReferralLink" WHERE "id" = ?`, id);
    return { success: true };
  } catch (err: any) {
    console.error("[Referral] deleteReferralLink error:", err);
    return { success: false, error: err.message || "Failed to delete referral link." };
  }
}
