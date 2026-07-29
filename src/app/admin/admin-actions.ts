"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { sendSystemEmail } from "@/lib/system-mailer";
import { newsletterTemplate } from "@/lib/email-templates/newsletter";
import { generateUnsubscribeSignature } from "@/lib/unsubscribe";

export async function getAdminStatsAction() {
  await requireAdmin();

  const [totalUsers, totalOrgs] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
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

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  });

  return {
    totalUsers,
    totalOrgs,
    activeUsers,
    bannedUsers,
    suspendedUsers,
    planDistribution: { free: freePlans, personal: personalPlans, business: businessPlans, enterprise: enterprisePlans },
    recentUsers,
  };
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
