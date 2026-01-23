import { prisma } from "@/lib/db";

/**
 * Get all reviews received by a user.
 * Includes reviewer info and rental listing title.
 */
export async function getReviewsForUser(userId: string) {
  return prisma.review.findMany({
    where: { revieweeId: userId },
    include: {
      reviewer: {
        select: { id: true, name: true, image: true },
      },
      rental: {
        select: {
          listing: {
            select: { title: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get reviews for a listing (reviews of the owner from renters who used this listing).
 */
export async function getReviewsForListing(listingId: string) {
  return prisma.review.findMany({
    where: {
      rental: { listingId },
    },
    include: {
      reviewer: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Check if a user has already reviewed a specific rental.
 */
export async function hasReviewed(
  rentalId: string,
  reviewerId: string
): Promise<boolean> {
  const review = await prisma.review.findUnique({
    where: {
      rentalId_reviewerId: {
        rentalId,
        reviewerId,
      },
    },
    select: { id: true },
  });
  return review !== null;
}
