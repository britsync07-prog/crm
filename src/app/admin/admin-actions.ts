"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { sendSystemEmail } from "@/lib/system-mailer";
import { newsletterTemplate } from "@/lib/email-templates/newsletter";
import { generateUnsubscribeSignature } from "@/lib/unsubscribe";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { ensurePricingTables, getPricingOffers, getPricingPlans } from "@/lib/pricing";

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

async function getSystemEmailProfileRows() {
  await ensureSystemEmailProfileTable();
  return prisma.$queryRawUnsafe<SystemEmailProfileRow[]>(
    `SELECT * FROM "SystemEmailProfile" WHERE "profile" IN ('transactional', 'newsletter')`
  );
}

export async function getAdminStatsAction() {
  await requireAdmin();

  const [totalUsers, totalOrgs, totalEmailAccounts, activeCampaigns, totalForms] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.emailAccount.count(),
    prisma.campaign.count({ where: { status: { in: ["Running", "ACTIVE", "Active"] } } }),
    prisma.form.count(),
  ]);

  const [activeUsers, bannedUsers, suspendedUsers] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "BANNED" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
  ]);

  const [freePlans, personalPlans, businessPlans, enterprisePlans] = await Promise.all([
    prisma.organization.count({ where: { plan: "free" } }),
    prisma.organization.count({ where: { plan: "personal" } }),
    prisma.organization.count({ where: { plan: "business" } }),
    prisma.organization.count({ where: { plan: "enterprise" } }),
  ]);

  const [recentUsers, recentOrgs] = await Promise.all([
    prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    }),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        plan: true,
        seatLimit: true,
        subscriptionStatus: true,
        owner: { select: { email: true, name: true } },
        members: { select: { id: true } },
      },
    }),
  ]);

  return {
    totalUsers,
    totalOrgs,
    totalEmailAccounts,
    activeCampaigns,
    totalForms,
    activeUsers,
    bannedUsers,
    suspendedUsers,
    planDistribution: { free: freePlans, personal: personalPlans, business: businessPlans, enterprise: enterprisePlans },
    recentUsers,
    recentOrgs,
  };
}

export async function getAdminOrganizationsAction(query = "", page = 1, pageSize = 20) {
  await requireAdmin();

  const where = query.trim()
    ? {
        OR: [
          { name: { contains: query.trim() } },
          { owner: { email: { contains: query.trim() } } },
          { owner: { name: { contains: query.trim() } } },
        ],
      }
    : {};

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        plan: true,
        seatLimit: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        updatedAt: true,
        owner: { select: { id: true, name: true, email: true, status: true } },
        members: {
          select: { id: true, status: true, email: true, role: true },
        },
      },
    }),
    prisma.organization.count({ where }),
  ]);

  return { organizations, total, page, totalPages: Math.ceil(total / pageSize) };
}

export async function updateOrganizationAdminAction(
  _prevState: { success: boolean; error: string | null },
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  const session = await requireAdmin();
  const organizationId = String(formData.get("organizationId") || "");
  const plan = String(formData.get("plan") || "");
  const subscriptionStatus = String(formData.get("subscriptionStatus") || "");
  const seatLimit = Number(formData.get("seatLimit"));

  const allowedPlans = ["free", "personal", "business", "enterprise"];
  const allowedStatuses = ["free", "active", "trialing", "past_due", "canceled", "unpaid"];

  if (!organizationId) return { success: false, error: "Organization is required" };
  if (!allowedPlans.includes(plan)) return { success: false, error: "Invalid plan" };
  if (!allowedStatuses.includes(subscriptionStatus)) return { success: false, error: "Invalid subscription status" };
  if (!Number.isInteger(seatLimit) || seatLimit < 1 || seatLimit > 1000) {
    return { success: false, error: "Seat limit must be between 1 and 1000" };
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { plan, subscriptionStatus, seatLimit },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      action: "ADMIN_UPDATE_ORGANIZATION",
      details: `Updated organization ${organizationId}: ${plan}, ${subscriptionStatus}, ${seatLimit} seats`,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/organizations");
  return { success: true, error: null };
}

export async function getAdminOperationsAction() {
  await requireAdmin();

  const [
    users,
    organizations,
    emailAccounts,
    incompleteMailboxes,
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
    prisma.emailAccount.count({ where: { OR: [{ imapHost: null }, { imapPort: null }] } }),
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
      include: { user: { select: { email: true, name: true } } },
    }),
    getSystemEmailProfileRows(),
  ]);

  const profileReady = (profile: "transactional" | "newsletter") => {
    const saved = systemEmailProfiles.find((item) => item.profile === profile);
    if (saved?.isEnabled && saved.host && saved.username && saved.password) return true;
    return Boolean(
      process.env.SYSTEM_SMTP_HOST &&
      process.env.SYSTEM_SMTP_PASSWORD &&
      (profile === "transactional" ? process.env.SYSTEM_SMTP_USER_TRANSACTIONAL : process.env.SYSTEM_SMTP_USER_NEWSLETTER)
    );
  };

  return {
    counts: {
      users,
      organizations,
      emailAccounts,
      incompleteMailboxes,
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
    recentActivity,
  };
}

export async function getSystemEmailProfilesAction() {
  await requireAdmin();

  const saved = await getSystemEmailProfileRows();

  const byProfile = new Map(saved.map((item) => [item.profile, item]));

  return (["transactional", "newsletter"] as const).map((profile) => {
    const item = byProfile.get(profile);
    return {
      profile,
      host: item?.host || "",
      port: item?.port || (profile === "transactional" ? Number(process.env.SYSTEM_SMTP_PORT_TRANSACTIONAL || 587) : Number(process.env.SYSTEM_SMTP_PORT_NEWSLETTER || 587)),
      username: item?.username || "",
      fromEmail: item?.fromEmail || "",
      fromName: item?.fromName || "BritCRM",
      secureMode: item?.secureMode || "STARTTLS",
      isEnabled: Boolean(item?.isEnabled),
      hasPassword: Boolean(item?.password || process.env.SYSTEM_SMTP_PASSWORD),
      envConfigured: Boolean(
        process.env.SYSTEM_SMTP_HOST &&
        process.env.SYSTEM_SMTP_PASSWORD &&
        (profile === "transactional" ? process.env.SYSTEM_SMTP_USER_TRANSACTIONAL : process.env.SYSTEM_SMTP_USER_NEWSLETTER)
      ),
    };
  });
}

export async function saveSystemEmailProfileAction(
  _prevState: { success: boolean; error: string | null },
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  const session = await requireAdmin();
  const profile = String(formData.get("profile") || "");
  const host = String(formData.get("host") || "").trim();
  const port = Number(formData.get("port"));
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const fromEmail = String(formData.get("fromEmail") || "").trim();
  const fromName = String(formData.get("fromName") || "").trim();
  const secureMode = String(formData.get("secureMode") || "STARTTLS");
  const isEnabled = formData.get("isEnabled") === "on";

  if (!["transactional", "newsletter"].includes(profile)) return { success: false, error: "Invalid profile" };
  if (!host || !username || !fromEmail) return { success: false, error: "Host, username, and from email are required" };
  if (!Number.isInteger(port) || port < 1 || port > 65535) return { success: false, error: "Port must be valid" };
  if (!["STARTTLS", "SSL/TLS", "NONE"].includes(secureMode)) return { success: false, error: "Invalid security mode" };

  await ensureSystemEmailProfileTable();
  const existingRows = await prisma.$queryRawUnsafe<SystemEmailProfileRow[]>(
    `SELECT * FROM "SystemEmailProfile" WHERE "profile" = ? LIMIT 1`,
    profile
  );
  const existing = existingRows[0];
  const passwordToSave = password || existing?.password || process.env.SYSTEM_SMTP_PASSWORD || "";
  if (!passwordToSave) return { success: false, error: "Password is required the first time you save this profile" };

  if (existing) {
    await prisma.$executeRawUnsafe(
      `UPDATE "SystemEmailProfile"
       SET "host" = ?, "port" = ?, "username" = ?, "password" = ?, "fromEmail" = ?, "fromName" = ?, "secureMode" = ?, "isEnabled" = ?, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "profile" = ?`,
      host,
      port,
      username,
      passwordToSave,
      fromEmail,
      fromName,
      secureMode,
      isEnabled ? 1 : 0,
      profile
    );
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "SystemEmailProfile" ("id", "profile", "host", "port", "username", "password", "fromEmail", "fromName", "secureMode", "isEnabled", "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      crypto.randomUUID(),
      profile,
      host,
      port,
      username,
      passwordToSave,
      fromEmail,
      fromName,
      secureMode,
      isEnabled ? 1 : 0
    );
  }

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      action: "ADMIN_UPDATE_SYSTEM_EMAIL",
      details: `Updated ${profile} SMTP profile (${host}:${port})`,
    },
  });

  revalidatePath("/admin/system-email");
  revalidatePath("/admin/operations");
  return { success: true, error: null };
}

export async function testSystemEmailProfileAction(
  _prevState: { success: boolean; error: string | null },
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  await requireAdmin();
  const profile = String(formData.get("profile") || "") as "transactional" | "newsletter";
  const to = String(formData.get("to") || "").trim();

  if (!["transactional", "newsletter"].includes(profile)) return { success: false, error: "Invalid profile" };
  if (!to || !to.includes("@")) return { success: false, error: "Enter a valid test email address" };

  await ensureSystemEmailProfileTable();
  const rows = await prisma.$queryRawUnsafe<SystemEmailProfileRow[]>(
    `SELECT * FROM "SystemEmailProfile" WHERE "profile" = ? LIMIT 1`,
    profile
  );
  const saved = rows[0];
  if (!saved?.isEnabled || !saved.host || !saved.username || !saved.password) {
    return { success: false, error: "Profile is not fully configured or enabled" };
  }

  const mode = saved.secureMode.toUpperCase();
  const secure = saved.port === 465 || mode === "SSL" || mode === "SSL/TLS";
  const transporter = nodemailer.createTransport({
    host: saved.host,
    port: saved.port,
    secure,
    requireTLS: !secure && mode === "STARTTLS",
    auth: { user: saved.username, pass: saved.password },
  });

  try {
    await transporter.verify();
    await sendSystemEmail({
      to,
      subject: `BritCRM ${profile} SMTP test`,
      html: `<p>This is a BritCRM ${profile} SMTP test email.</p>`,
      profile,
    });
    return { success: true, error: null };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "SMTP test failed";
    const message = /From domain .*not verified/i.test(raw)
      ? "SMTP rejected the From address because its domain is not verified for this account. Use a verified From Email in this profile."
      : raw;
    return { success: false, error: message };
  }
}

export async function searchUsersAction(query: string, page = 1, pageSize = 20) {
  await requireAdmin();

  const where = query
    ? {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      }
    : {};

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
        bannedAt: true,
        createdAt: true,
        organizationId: true,
        memberProfile: { select: { organization: { select: { name: true, plan: true } } } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, totalPages: Math.ceil(total / pageSize) };
}

export async function getUserDetailAction(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      bannedAt: true,
      bannedBy: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      organizationId: true,
      memberProfile: {
        select: {
          role: true,
          organization: {
            select: { id: true, name: true, plan: true, seatLimit: true, subscriptionStatus: true },
          },
        },
      },
      ownedOrganization: {
        select: { id: true, name: true, plan: true, seatLimit: true, subscriptionStatus: true },
      },
      employeeProfile: { select: { department: true, position: true, status: true } },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  return user;
}

export async function updateUserPasswordAction(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin();

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  await prisma.activityLog.create({
    data: { userId: session.id, action: "ADMIN_CHANGE_PASSWORD", details: `Changed password for user ${userId}` },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserRoleAction(userId: string, role: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin();

  if (userId === session.id && role !== "ADMIN") {
    return { success: false, error: "Cannot demote yourself" };
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });

  await prisma.activityLog.create({
    data: { userId: session.id, action: "ADMIN_CHANGE_ROLE", details: `Changed role to ${role} for user ${userId}` },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserStatusAction(userId: string, status: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin();

  if (userId === session.id) {
    return { success: false, error: "Cannot change your own status" };
  }

  const data: any = { status };
  if (status === "BANNED") data.bannedAt = new Date();
  if (status === "SUSPENDED") data.bannedAt = new Date();
  if (status === "ACTIVE") { data.bannedAt = null; data.bannedBy = null; }

  await prisma.user.update({ where: { id: userId }, data });

  await prisma.activityLog.create({
    data: { userId: session.id, action: `ADMIN_${status}`, details: `Set user ${userId} to ${status}` },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserSubscriptionAction(userId: string, plan: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const org = await prisma.organization.findFirst({
    where: { ownerId: userId },
  });

  if (!org) return { success: false, error: "User has no organization" };

  const seatLimit = plan === "free" ? 1 : plan === "personal" ? 5 : plan === "business" ? 20 : 100;

  await prisma.organization.update({
    where: { id: org.id },
    data: { plan, seatLimit, subscriptionStatus: plan === "free" ? "free" : "active" },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin();

  if (userId === session.id) {
    return { success: false, error: "Cannot delete yourself" };
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function sendNewsletterAction(subject: string, body: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin();

  if (!subject.trim() || !body.trim()) {
    return { success: false, error: "Subject and body are required" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const users = await prisma.user.findMany({
    where: { status: "ACTIVE", newsletterOptedIn: true },
    select: { id: true, email: true, name: true },
  });

  if (users.length === 0) {
    return { success: false, error: "No opted-in active users to send to" };
  }

  for (const user of users) {
    const sig = generateUnsubscribeSignature(user.id);
    const unsubscribeUrl = `${baseUrl}/unsubscribe?uid=${user.id}&sig=${sig}`;
    const html = newsletterTemplate(subject, body, unsubscribeUrl);
    const personalizedHtml = html.replace(/{{name}}/g, user.name || "there");
    await sendSystemEmail({
      to: user.email,
      subject,
      html: personalizedHtml,
      profile: "newsletter",
    });
  }

  await prisma.newsletter.create({
    data: { subject, body, recipientCount: users.length, sentAt: new Date(), createdBy: session.id },
  });

  revalidatePath("/admin/newsletter");
  return { success: true };
}

export async function getNewsletterHistoryAction() {
  await requireAdmin();

  const newsletters = await prisma.newsletter.findMany({
    orderBy: { sentAt: "desc" },
    take: 50,
  });

  return newsletters;
}

export async function getAdminPricingAction() {
  await requireAdmin();
  const [plans, offers] = await Promise.all([getPricingPlans(), getPricingOffers()]);
  return { plans, offers };
}

export async function savePricingPlanAction(
  _prevState: { success: boolean; error: string | null },
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "");
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const monthlyPriceRaw = String(formData.get("monthlyPrice") || "").trim();
  const seatLimitRaw = String(formData.get("seatLimit") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const trialDays = Number(formData.get("trialDays") || 0);
  const features = String(formData.get("features") || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const isActive = formData.get("isActive") === "on";
  const isPopular = formData.get("isPopular") === "on";
  const ctaLabel = String(formData.get("ctaLabel") || "").trim() || null;
  const stripePriceId = String(formData.get("stripePriceId") || "").trim() || null;

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return { success: false, error: "Plan slug must use lowercase letters, numbers, and dashes" };
  if (!name) return { success: false, error: "Plan name is required" };
  if (!Number.isInteger(trialDays) || trialDays < 0 || trialDays > 365) return { success: false, error: "Trial days must be between 0 and 365" };
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) return { success: false, error: "Sort order must be between 0 and 9999" };

  const monthlyPriceCents = monthlyPriceRaw.toLowerCase() === "custom" || monthlyPriceRaw === ""
    ? null
    : Math.round(Number(monthlyPriceRaw) * 100);
  if (monthlyPriceCents !== null && (!Number.isInteger(monthlyPriceCents) || monthlyPriceCents < 0)) {
    return { success: false, error: "Monthly price must be a valid amount or Custom" };
  }

  const seatLimit = seatLimitRaw.toLowerCase() === "unlimited" || seatLimitRaw === ""
    ? null
    : Number(seatLimitRaw);
  if (seatLimit !== null && (!Number.isInteger(seatLimit) || seatLimit < 1 || seatLimit > 10000)) {
    return { success: false, error: "Seat limit must be a whole number or Unlimited" };
  }

  await ensurePricingTables();

  if (id) {
    await prisma.$executeRawUnsafe(
      `UPDATE "PricingPlan"
       SET "slug" = ?, "name" = ?, "description" = ?, "monthlyPriceCents" = ?, "seatLimit" = ?, "featuresJson" = ?,
           "stripePriceId" = ?, "isActive" = ?, "isPopular" = ?, "sortOrder" = ?, "trialDays" = ?, "ctaLabel" = ?, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = ?`,
      slug,
      name,
      description,
      monthlyPriceCents,
      seatLimit,
      JSON.stringify(features),
      stripePriceId,
      isActive ? 1 : 0,
      isPopular ? 1 : 0,
      sortOrder,
      trialDays,
      ctaLabel,
      id
    );
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PricingPlan"
       ("id", "slug", "name", "description", "monthlyPriceCents", "seatLimit", "featuresJson", "stripePriceId", "isActive", "isPopular", "sortOrder", "trialDays", "ctaLabel", "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      crypto.randomUUID(),
      slug,
      name,
      description,
      monthlyPriceCents,
      seatLimit,
      JSON.stringify(features),
      stripePriceId,
      isActive ? 1 : 0,
      isPopular ? 1 : 0,
      sortOrder,
      trialDays,
      ctaLabel
    );
  }

  await prisma.activityLog.create({
    data: { userId: session.id, action: "ADMIN_UPDATE_PRICING_PLAN", details: `Updated pricing plan ${slug}` },
  });

  revalidatePath("/admin/pricing");
  revalidatePath("/pricing");
  revalidatePath("/settings/billing");
  return { success: true, error: null };
}

export async function savePricingOfferAction(
  _prevState: { success: boolean; error: string | null },
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const discountPercent = Number(formData.get("discountPercent") || 0);
  const couponCode = String(formData.get("couponCode") || "").trim() || null;
  const startsAtRaw = String(formData.get("startsAt") || "");
  const endsAtRaw = String(formData.get("endsAt") || "");
  const appliesToPlanSlug = String(formData.get("appliesToPlanSlug") || "").trim() || null;
  const isActive = formData.get("isActive") === "on";
  const startsAt = new Date(startsAtRaw);
  const endsAt = new Date(endsAtRaw);

  if (!title) return { success: false, error: "Offer title is required" };
  if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 95) {
    return { success: false, error: "Discount must be between 1% and 95%" };
  }
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return { success: false, error: "Offer dates are required" };
  if (startsAt >= endsAt) return { success: false, error: "Offer end date must be after start date" };

  await ensurePricingTables();

  if (id) {
    await prisma.$executeRawUnsafe(
      `UPDATE "PricingOffer"
       SET "title" = ?, "description" = ?, "discountPercent" = ?, "couponCode" = ?, "startsAt" = ?, "endsAt" = ?,
           "isActive" = ?, "appliesToPlanSlug" = ?, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = ?`,
      title,
      description,
      discountPercent,
      couponCode,
      startsAt.toISOString(),
      endsAt.toISOString(),
      isActive ? 1 : 0,
      appliesToPlanSlug,
      id
    );
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PricingOffer"
       ("id", "title", "description", "discountPercent", "couponCode", "startsAt", "endsAt", "isActive", "appliesToPlanSlug", "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      crypto.randomUUID(),
      title,
      description,
      discountPercent,
      couponCode,
      startsAt.toISOString(),
      endsAt.toISOString(),
      isActive ? 1 : 0,
      appliesToPlanSlug
    );
  }

  await prisma.activityLog.create({
    data: { userId: session.id, action: "ADMIN_UPDATE_PRICING_OFFER", details: `Updated offer ${title}` },
  });

  revalidatePath("/admin/pricing");
  revalidatePath("/pricing");
  revalidatePath("/settings/billing");
  return { success: true, error: null };
}
