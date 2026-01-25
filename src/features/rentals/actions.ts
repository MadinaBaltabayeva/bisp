"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { rentalRequestSchema } from "@/lib/validations/rental";
import { getSession } from "@/features/auth/queries";
import { checkNotSuspended } from "@/features/admin/queries";

/**
 * Create a new rental request.
 * Renter submits a request with date range and optional message.
 */
export async function createRentalRequest(data: unknown) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to request a rental." };
  }

  const suspended = await checkNotSuspended();
  if (suspended.error) return { error: suspended.error };

  const result = rentalRequestSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0];
    return { error: firstError || "Invalid input." };
  }

  const { listingId, startDate, endDate, message } = result.data;

  // Verify listing exists and is active
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, ownerId: true, status: true, priceDaily: true },
  });

  if (!listing) {
    return { error: "Listing not found." };
  }

  if (listing.status !== "active") {
    return { error: "This listing is not available for rental." };
  }

  // Prevent self-rental
  if (session.user.id === listing.ownerId) {
    return { error: "You cannot rent your own listing." };
  }

  // Calculate pricing
  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dailyRate = listing.priceDaily ?? 0;
  const totalPrice = days * dailyRate;
  const securityDeposit = totalPrice * 0.2;

  try {
    await prisma.rental.create({
      data: {
        startDate,
        endDate,
        status: "requested",
        message: message || "",
        totalPrice,
        securityDeposit,
        listingId,
        renterId: session.user.id,
        ownerId: listing.ownerId,
      },
    });

    revalidatePath("/rentals");
    revalidatePath(`/listings/${listingId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to create rental request:", error);
    return { error: "Failed to create rental request. Please try again." };
  }
}

/**
 * Approve a rental request. Only the listing owner can approve.
 */
export async function approveRental(rentalId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in." };
  }

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: { ownerId: true, status: true },
  });

  if (!rental) {
    return { error: "Rental not found." };
  }

  if (rental.ownerId !== session.user.id) {
    return { error: "Only the listing owner can approve rentals." };
  }

  if (rental.status !== "requested") {
    return { error: "This rental cannot be approved in its current state." };
  }

  try {
    await prisma.rental.update({
      where: { id: rentalId },
      data: { status: "approved" },
    });

    revalidatePath("/rentals");
    return { success: true };
  } catch (error) {
    console.error("Failed to approve rental:", error);
    return { error: "Failed to approve rental. Please try again." };
  }
}

/**
 * Decline a rental request. Only the listing owner can decline.
 */
export async function declineRental(rentalId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in." };
  }

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: { ownerId: true, status: true },
  });

  if (!rental) {
    return { error: "Rental not found." };
  }

  if (rental.ownerId !== session.user.id) {
    return { error: "Only the listing owner can decline rentals." };
  }

  if (rental.status !== "requested") {
    return { error: "This rental cannot be declined in its current state." };
  }

  try {
    await prisma.rental.update({
      where: { id: rentalId },
      data: { status: "declined" },
    });

    revalidatePath("/rentals");
    return { success: true };
  } catch (error) {
    console.error("Failed to decline rental:", error);
    return { error: "Failed to decline rental. Please try again." };
  }
}

/**
 * Mark an active rental as returned. Only the listing owner can mark returned.
 */
export async function markReturned(rentalId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in." };
  }

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: { ownerId: true, status: true },
  });

  if (!rental) {
    return { error: "Rental not found." };
  }

  if (rental.ownerId !== session.user.id) {
    return { error: "Only the listing owner can mark items as returned." };
  }

  if (rental.status !== "active") {
    return { error: "Only active rentals can be marked as returned." };
  }

  try {
    await prisma.rental.update({
      where: { id: rentalId },
      data: { status: "returned" },
    });

    revalidatePath("/rentals");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark rental as returned:", error);
    return { error: "Failed to mark rental as returned. Please try again." };
  }
}

/**
 * Complete a returned rental. Only the listing owner can complete.
 */
export async function completeRental(rentalId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in." };
  }

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: { ownerId: true, status: true },
  });

  if (!rental) {
    return { error: "Rental not found." };
  }

  if (rental.ownerId !== session.user.id) {
    return { error: "Only the listing owner can complete rentals." };
  }

  if (rental.status !== "returned") {
    return { error: "Only returned rentals can be completed." };
  }

  try {
    await prisma.rental.update({
      where: { id: rentalId },
      data: { status: "completed" },
    });

    revalidatePath("/rentals");
    return { success: true };
  } catch (error) {
    console.error("Failed to complete rental:", error);
    return { error: "Failed to complete rental. Please try again." };
  }
}
