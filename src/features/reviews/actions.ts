"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { reviewSchema } from "@/lib/validations/review";
import { getSession } from "@/features/auth/queries";

/**
 * Create a review for a completed rental.
 * Recalculates reviewee's averageRating and reviewCount in a transaction.
 */
export async function createReview(data: unknown) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to leave a review." };
  }

  const result = reviewSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0];
    return { error: firstError || "Invalid input." };
  }

  const { rentalId, revieweeId, rating, comment } = result.data;

  // Fetch the rental to verify status and participants
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: { id: true, status: true, renterId: true, ownerId: true },
  });

  if (!rental) {
    return { error: "Rental not found." };
  }

  if (rental.status !== "completed") {
    return { error: "You can only review completed rentals." };
  }

  // Verify the reviewer is either the renter or the owner
  const reviewerId = session.user.id;
  if (reviewerId !== rental.renterId && reviewerId !== rental.ownerId) {
    return { error: "You are not a participant in this rental." };
  }

  // Determine expected reviewee: if reviewer is renter, reviewee is owner and vice versa
  const expectedRevieweeId =
    reviewerId === rental.renterId ? rental.ownerId : rental.renterId;

  if (revieweeId !== expectedRevieweeId) {
    return { error: "Invalid reviewee for this rental." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Create the review
      await tx.review.create({
        data: {
          rating,
          comment: comment || "",
          rentalId,
          reviewerId,
          revieweeId,
        },
      });

      // Recalculate averageRating and reviewCount for the reviewee
      const aggregate = await tx.review.aggregate({
        where: { revieweeId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.user.update({
        where: { id: revieweeId },
        data: {
          averageRating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
          reviewCount: aggregate._count.rating,
        },
      });
    });

    revalidatePath("/rentals");
    revalidatePath(`/profiles/${revieweeId}`);

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    // Handle unique constraint violation (duplicate review)
    if (
      message.includes("UNIQUE") ||
      message.includes("unique") ||
      message.includes("Unique")
    ) {
      return { error: "You have already reviewed this rental." };
    }
    console.error("Failed to create review:", error);
    return { error: "Failed to create review. Please try again." };
  }
}
