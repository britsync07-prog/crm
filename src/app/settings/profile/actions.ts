"use server";

import { prisma } from "@/lib/db";
import { getSession, login } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

export async function updateProfileAction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const name = (formData.get("name") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.toLowerCase()?.trim();
  const image = (formData.get("image") as string)?.trim() || null;
  const newsletterOptedIn = formData.get("newsletterOptedIn") === "true";

  if (!email) {
    return { error: "Email address is required" };
  }

  // Check if email changed and if another user has it
  if (email !== session.email?.toLowerCase()) {
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing && existing.id !== session.id) {
      return { error: "This email address is already registered to another account" };
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.id },
    data: {
      name,
      email,
      image,
      newsletterOptedIn,
    },
  });

  // Refresh the user session cookie with the new data
  await login(updatedUser);

  revalidatePath("/settings/profile");
  revalidatePath("/", "layout");

  return { success: true, message: "Profile updated successfully!" };
}

export async function changePasswordAction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword) {
    return { error: "Current password is required" };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "New password must be at least 6 characters long" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation do not match" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
  });

  if (!user) {
    return { error: "User account not found" };
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return { error: "Current password is incorrect" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return { success: true, message: "Password updated successfully!" };
}
