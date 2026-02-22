"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/queries";

/**
 * Mark a single notification as read (only if owned by session user).
 */
export async function markNotificationRead(notificationId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: session.user.id },
    data: { read: true },
  });

  revalidatePath("/");
}

/**
 * Mark all unread notifications as read for the session user.
 */
export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  await prisma.notification.updateMany({
    where: { recipientId: session.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/");
}

/**
 * Toggle the user's email notification preference.
 */
export async function updateEmailPreference(enabled: boolean) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { emailNotifications: enabled },
  });

  revalidatePath("/settings");
}
