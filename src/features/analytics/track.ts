"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/queries";

export async function trackListingView(listingId: string) {
  const session = await getSession();
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) return;

  await prisma.analyticsEvent.create({
    data: {
      type: "listing_view",
      listingId,
      userId: listing.ownerId,
      viewerId: session?.user.id ?? null,
    },
  });
}

export async function trackSearchImpressions(listingIds: string[]) {
  if (listingIds.length === 0) return;

  const listings = await prisma.listing.findMany({
    where: { id: { in: listingIds } },
    select: { id: true, ownerId: true },
  });

  const session = await getSession();

  await prisma.analyticsEvent.createMany({
    data: listings.map((l) => ({
      type: "search_impression",
      listingId: l.id,
      userId: l.ownerId,
      viewerId: session?.user.id ?? null,
    })),
  });
}

export async function trackProfileView(profileUserId: string) {
  const session = await getSession();
  if (session?.user.id === profileUserId) return; // don't track self-views

  await prisma.analyticsEvent.create({
    data: {
      type: "profile_view",
      userId: profileUserId,
      viewerId: session?.user.id ?? null,
    },
  });
}
