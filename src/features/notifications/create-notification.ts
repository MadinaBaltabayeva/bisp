import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";

export type NotificationType = "rental" | "message" | "review" | "favorite";

export interface CreateNotificationParams {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl: string;
  sendEmail?: boolean;
}

/**
 * Create a notification and optionally send an email.
 * Skips self-notifications. Deduplicates message-type notifications.
 * Email errors are caught silently (fire-and-forget).
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  const { recipientId, actorId, type, title, message, linkUrl, sendEmail } =
    params;

  // Self-notification guard
  if (recipientId === actorId) return;

  // Message-type deduplication: update existing unread notification instead of creating duplicate
  if (type === "message") {
    const existing = await prisma.notification.findFirst({
      where: {
        recipientId,
        type: "message",
        linkUrl,
        read: false,
      },
    });

    if (existing) {
      await prisma.notification.update({
        where: { id: existing.id },
        data: { createdAt: new Date(), title, message },
      });
      return;
    }
  }

  // Create notification in database
  await prisma.notification.create({
    data: {
      recipientId,
      actorId,
      type,
      title,
      message,
      linkUrl,
    },
  });

  // Send email for non-favorite types when enabled
  if (type !== "favorite" && sendEmail !== false) {
    try {
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
        select: {
          email: true,
          name: true,
          emailNotifications: true,
        },
      });

      if (recipient?.emailNotifications) {
        await sendNotificationEmail({
          to: recipient.email,
          recipientName: recipient.name,
          subject: title,
          body: message,
          linkUrl,
        });
      }
    } catch (error) {
      // Fire-and-forget: email failure should not block notification creation
      console.error("Failed to send notification email:", error);
    }
  }
}
