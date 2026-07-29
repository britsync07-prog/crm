"use server";

import { prisma } from "@/lib/db";
import { login, logout } from "@/lib/auth";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { sendSystemEmail } from "@/lib/system-mailer";
import { welcomeEmailTemplate } from "@/lib/email-templates/welcome";

export async function loginAction(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string)?.toLowerCase()?.trim();
  const password = formData.get("password") as string;
  const inviteToken = formData.get("inviteToken") as string;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: "Invalid credentials" };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return { error: "Invalid credentials" };
  }

  await login(user);

  const callbackUrl = formData.get("callbackUrl") as string;
  if (callbackUrl && callbackUrl.startsWith("/")) {
    redirect(callbackUrl);
  }

  if (inviteToken) {
    redirect(`/invite/${inviteToken}`);
  }

  redirect("/");
}

export async function signupAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.toLowerCase()?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const inviteToken = formData.get("inviteToken") as string;

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "User already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  if (inviteToken) {
    const invite = await prisma.organizationMember.findUnique({
      where: { inviteToken },
    });

    if (invite && invite.status === "pending" && invite.email === email) {
      await prisma.organizationMember.update({
        where: { id: invite.id },
        data: { status: "active", userId: user.id, lastActive: new Date() },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: invite.organizationId },
      });
    }
  }

  if (!user.organizationId) {
    const org = await prisma.organization.create({
      data: {
        name: `${name}'s Organization`,
        ownerId: user.id,
        plan: "free",
        seatLimit: 1,
      },
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        email,
        role: "admin",
        status: "active",
        invitedById: user.id,
        lastActive: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: org.id },
    });
  }

  sendSystemEmail({
    to: user.email,
    subject: "Welcome to BritCRM",
    html: welcomeEmailTemplate(user.name || "there"),
    profile: "transactional",
  });

  await login(user);

  const signupCallback = formData.get("callbackUrl") as string;
  if (signupCallback && signupCallback.startsWith("/")) {
    redirect(signupCallback);
  }

  redirect("/");
}

export async function logoutAction() {
  await logout();
  redirect("/landing");
}
