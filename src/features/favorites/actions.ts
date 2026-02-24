"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/queries";
import { createNotification } from "@/features/notifications/create-notification";

/**
 * Toggle a listing as a favorite for the current user.
 * Creates a favorite if none exists, deletes it if one does.
 */
export async function toggleFavorite(listingId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Must be logged in." };
  }

  const userId = session.user.id;

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId, listingId } },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { userId_listingId: { userId, listingId } },
    });
    revalidatePath("/favorites");
    revalidatePath(`/listings/${listingId}`);
    return { success: true, isFavorited: false };
  }

  await prisma.favorite.create({
    data: { userId, listingId },
  });
  revalidatePath("/favorites");
  revalidatePath(`/listings/${listingId}`);

  // Notify listing owner about the favorite (in-app only, fire-and-forget)
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, title: true },
  });

  if (listing) {
    createNotification({
      recipientId: listing.ownerId,
      actorId: userId,
      type: "favorite",
      title: `${session.user.name} saved your '${listing.title}' to favorites`,
      message: "Someone favorited your listing",
      linkUrl: `/listings/${listingId}`,
      sendEmail: false,
    }).catch(() => {});
  }

  return { success: true, isFavorited: true };
}
