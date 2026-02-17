import { prisma } from "@/lib/db";

/**
 * Get the set of listing IDs that a user has favorited.
 */
export async function getUserFavoriteIds(userId: string): Promise<Set<string>> {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { listingId: true },
  });
  return new Set(favorites.map((f) => f.listingId));
}

/**
 * Get all favorites for a user with full listing data included.
 * Returns favorites ordered by most recently added first.
 */
export async function getFavoriteListings(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: {
          images: {
            where: { isCover: true },
            take: 1,
          },
          category: true,
          owner: {
            select: {
              id: true,
              idVerified: true,
            },
          },
        },
      },
    },
  });
}
