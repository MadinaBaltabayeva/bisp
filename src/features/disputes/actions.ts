"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/queries";
import { createNotification } from "@/features/notifications/create-notification";

/**
 * Resolve a dispute as admin.
 * - favor_renter: rental -> cancelled
 * - favor_owner / dismiss: rental -> previousStatus (restored)
 * Notifies both parties.
 */
export async function resolveDispute(
  disputeId: string,
  resolution: "favor_renter" | "favor_owner" | "dismiss",
  note?: string
) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      rental: {
        select: {
          id: true,
          renterId: true,
          ownerId: true,
          listing: { select: { title: true } },
        },
      },
    },
  });

  if (!dispute) {
    return { error: "Dispute not found." };
  }

  if (dispute.status !== "open") {
    return { error: "This dispute has already been resolved." };
  }

  // Determine new rental status based on resolution
  const newStatus =
    resolution === "favor_renter"
      ? "cancelled"
      : dispute.previousStatus;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: "resolved",
          resolution,
          resolvedById: session.user.id,
          resolvedAt: new Date(),
          resolutionNote: note || null,
        },
      });

      await tx.rental.update({
        where: { id: dispute.rental.id },
        data: { status: newStatus },
      });

      await tx.rentalEvent.create({
        data: {
          rentalId: dispute.rental.id,
          status: newStatus,
          actorId: session.user.id,
        },
      });
    });

    revalidatePath("/admin/disputes");
    revalidatePath("/rentals");
    revalidatePath(`/rentals/${dispute.rental.id}`);

    // Build resolution text for notification
    const resolutionText =
      resolution === "favor_renter"
        ? "resolved in favor of the renter"
        : resolution === "favor_owner"
          ? "resolved in favor of the owner"
          : "dismissed";

    const listingTitle = dispute.rental.listing.title;
    const notificationTitle = `Dispute on '${listingTitle}' has been ${resolutionText}`;
    const notificationMessage =
      note || "The admin has resolved the dispute.";

    // Notify both renter and owner (fire-and-forget)
    createNotification({
      recipientId: dispute.rental.renterId,
      actorId: session.user.id,
      type: "rental",
      title: notificationTitle,
      message: notificationMessage,
      linkUrl: "/rentals",
    }).catch(() => {});

    createNotification({
      recipientId: dispute.rental.ownerId,
      actorId: session.user.id,
      type: "rental",
      title: notificationTitle,
      message: notificationMessage,
      linkUrl: "/rentals",
    }).catch(() => {});

    return { success: true };
  } catch (error) {
    console.error("Failed to resolve dispute:", error);
    return { error: "Failed to resolve dispute. Please try again." };
  }
}
