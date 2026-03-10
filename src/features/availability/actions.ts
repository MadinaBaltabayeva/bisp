"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/queries";

export async function addAvailabilityBlock(
  listingId: string,
  startDate: Date,
  endDate: Date,
  reason: string
) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });

  if (!listing || listing.ownerId !== session.user.id) {
    return { error: "Not authorized" };
  }

  if (endDate <= startDate) {
    return { error: "End date must be after start date" };
  }

  await prisma.availabilityBlock.create({
    data: { listingId, startDate, endDate, reason },
  });

  revalidatePath(`/listings/${listingId}/edit`);
  revalidatePath(`/listings/${listingId}`);
  return { success: true };
}

export async function removeAvailabilityBlock(blockId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const block = await prisma.availabilityBlock.findUnique({
    where: { id: blockId },
    include: { listing: { select: { ownerId: true, id: true } } },
  });

  if (!block || block.listing.ownerId !== session.user.id) {
    return { error: "Not authorized" };
  }

  await prisma.availabilityBlock.delete({ where: { id: blockId } });

  revalidatePath(`/listings/${block.listing.id}/edit`);
  revalidatePath(`/listings/${block.listing.id}`);
  return { success: true };
}
