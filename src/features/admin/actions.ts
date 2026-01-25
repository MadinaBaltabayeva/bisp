"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/queries";

/**
 * Suspend a user. Admin only. Cannot suspend self.
 */
export async function suspendUser(userId: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  if (userId === session.user.id) {
    return { error: "Cannot suspend yourself" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isSuspended: true },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Unsuspend a user. Admin only.
 */
export async function unsuspendUser(userId: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isSuspended: false },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Get counts of records that will be deleted when a user is removed.
 * Used by the confirmation dialog before deletion.
 */
export async function getUserDeletionCounts(userId: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const [listings, rentals, messages, reviews] = await Promise.all([
    prisma.listing.count({ where: { ownerId: userId } }),
    prisma.rental.count({
      where: { OR: [{ renterId: userId }, { ownerId: userId }] },
    }),
    prisma.message.count({ where: { senderId: userId } }),
    prisma.review.count({
      where: { OR: [{ reviewerId: userId }, { revieweeId: userId }] },
    }),
  ]);

  return { listings, rentals, messages, reviews };
}

/**
 * Delete a user permanently. Admin only. Cannot delete self.
 * Prisma cascades handle related records via onDelete: Cascade.
 */
export async function deleteUser(userId: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  if (userId === session.user.id) {
    return { error: "Cannot delete yourself" };
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Approve a flagged listing. Sets status to active and aiVerified to true.
 * Admin only. Keeps moderationResult for audit trail.
 */
export async function approveListing(listingId: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "active", aiVerified: true },
  });

  revalidatePath("/admin/moderation");
  return { success: true };
}

/**
 * Reject a flagged listing. Requires a reason.
 * Sets status to rejected and merges rejection info into moderationResult JSON.
 */
export async function rejectListing(listingId: string, reason: string) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  if (!reason.trim()) {
    return { error: "Rejection reason is required" };
  }

  // Read existing moderationResult and merge with rejection data
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { moderationResult: true },
  });

  let existing: Record<string, unknown> = {};
  if (listing?.moderationResult) {
    try {
      existing = JSON.parse(listing.moderationResult);
    } catch {
      existing = {};
    }
  }

  const updatedResult = JSON.stringify({
    ...existing,
    rejected: true,
    rejectionReason: reason,
  });

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "rejected", moderationResult: updatedResult },
  });

  revalidatePath("/admin/moderation");
  return { success: true };
}
