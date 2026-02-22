import { prisma } from "@/lib/db";

/**
 * Get count of unread notifications for a user.
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  return prisma.notification.count({
    where: { recipientId: userId, read: false },
  });
}

/**
 * Get notifications for a user, ordered by createdAt desc.
 * Includes actor info (id, name, image).
 */
export async function getNotifications(userId: string, limit?: number) {
  return prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      actor: { select: { id: true, name: true, image: true } },
    },
    take: limit,
  });
}
