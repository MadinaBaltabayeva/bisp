"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/queries";

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
  return { success: true, isFavorited: true };
}
