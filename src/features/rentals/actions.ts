"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { rentalRequestSchema } from "@/lib/validations/rental";
import type { PaymentFormValues } from "@/lib/validations/payment";
import { getSession } from "@/features/auth/queries";
import { checkNotSuspended } from "@/features/admin/queries";
import { createNotification } from "@/features/notifications/create-notification";

/**
 * Create a new rental request.
 * Renter submits a request with date range and optional message.
 * Atomically creates the rental and a "requested" RentalEvent.
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

  const { listingId, startDate, endDate, periodType, message } = result.data;

  // Verify listing exists and is active
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      status: true,
      priceHourly: true,
      priceDaily: true,
      priceWeekly: true,
      priceMonthly: true,
      title: true,
    },
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

  // Check for overlapping rentals (approved, active, or disputed)
  const overlapping = await prisma.rental.findFirst({
    where: {
      listingId,
      status: { in: ["approved", "active", "disputed"] },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
  });

  if (overlapping) {
    return {
      error:
        "These dates overlap with an existing rental. Please choose different dates.",
    };
  }

  // Check availability blocks
  const blockedOverlap = await prisma.availabilityBlock.findFirst({
    where: {
      listingId,
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
  });

  if (blockedOverlap) {
    return {
      error: "The owner has blocked these dates. Please choose different dates.",
    };
  }

  // Calculate period-aware pricing
  const diffMs = endDate.getTime() - startDate.getTime();
  let totalPrice: number;

  switch (periodType) {
    case "hourly": {
      const hours = Math.ceil(diffMs / (1000 * 60 * 60));
      totalPrice = hours * (listing.priceHourly ?? 0);
      break;
    }
    case "daily": {
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      totalPrice = days * (listing.priceDaily ?? 0);
      break;
    }
    case "weekly": {
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const weeks = Math.ceil(days / 7);
      totalPrice = weeks * (listing.priceWeekly ?? 0);
      break;
    }
    case "monthly": {
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const months = Math.ceil(days / 30);
      totalPrice = months * (listing.priceMonthly ?? 0);
      break;
    }
  }

  const securityDeposit = totalPrice * 0.2;

  try {
    await prisma.$transaction(async (tx) => {
      const newRental = await tx.rental.create({
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
      await tx.rentalEvent.create({
        data: {
          rentalId: newRental.id,
          status: "requested",
          actorId: session.user.id,
        },
      });
    });

    revalidatePath("/rentals");
    revalidatePath(`/listings/${listingId}`);

    // Notify the listing owner about the rental request (fire-and-forget)
    createNotification({
      recipientId: listing.ownerId,
      actorId: session.user.id,
      type: "rental",
      title: `${session.user.name} requested to rent your '${listing.title}'`,
      message: `Rental request (${periodType})`,
      linkUrl: `/rentals`,
    }).catch(() => {});

    return { success: true };
  } catch (error) {
    console.error("Failed to create rental request:", error);
    return { error: "Failed to create rental request. Please try again." };
  }
}

/**
 * Approve a rental request. Only the listing owner can approve.
 * Atomically updates rental status and creates an "approved" RentalEvent.
 */
export async function approveRental(rentalId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in." };
  }

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: { ownerId: true, renterId: true, status: true, listing: { select: { title: true } } },
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
    await prisma.$transaction([
      prisma.rental.update({
        where: { id: rentalId },
        data: { status: "approved", handoffCode: nanoid(10) },
      }),
      prisma.rentalEvent.create({
        data: {
          rentalId,
          status: "approved",
          actorId: session.user.id,
        },
      }),
    ]);

    revalidatePath("/rentals");

    createNotification({
      recipientId: rental.renterId,
      actorId: session.user.id,
      type: "rental",
      title: `${session.user.name} approved your rental of '${rental.listing.title}'`,
      message: "Your rental request has been approved",
      linkUrl: `/rentals`,
    }).catch(() => {});

    return { success: true };
  } catch (error) {
    console.error("Failed to approve rental:", error);
    return { error: "Failed to approve rental. Please try again." };
  }
}

/**
 * Decline a rental request. Only the listing owner can decline.
 * Atomically updates rental status and creates a "declined" RentalEvent.
 */
export async function declineRental(rentalId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in." };
  }

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: { ownerId: true, renterId: true, status: true, listing: { select: { title: true } } },
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
    await prisma.$transaction([
      prisma.rental.update({
        where: { id: rentalId },
        data: { status: "declined" },
      }),
      prisma.rentalEvent.create({
        data: {
          rentalId,
          status: "declined",
          actorId: session.user.id,
        },
      }),
    ]);

    revalidatePath("/rentals");

    createNotification({
      recipientId: rental.renterId,
      actorId: session.user.id,
      type: "rental",
      title: `${session.user.name} declined your rental request for '${rental.listing.title}'`,
      message: "Your rental request has been declined",
      linkUrl: `/rentals`,
    }).catch(() => {});

    return { success: true };
  } catch (error) {
    console.error("Failed to decline rental:", error);
    return { error: "Failed to decline rental. Please try again." };
  }
}

/**
 * Mark an active rental as returned. Only the listing owner can mark returned.
 * Atomically updates rental status and creates a "returned" RentalEvent.
 */
export async function markReturned(rentalId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in." };
  }

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: { ownerId: true, renterId: true, status: true, listing: { select: { title: true } } },
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
    await prisma.$transaction([
      prisma.rental.update({
        where: { id: rentalId },
        data: { status: "returned" },
      }),
      prisma.rentalEvent.create({
        data: {
          rentalId,
          status: "returned",
          actorId: session.user.id,
        },
      }),
    ]);

    revalidatePath("/rentals");

    createNotification({
      recipientId: rental.renterId,
      actorId: session.user.id,
      type: "rental",
      title: `Your rental of '${rental.listing.title}' has been marked as returned`,
      message: "The listing owner confirmed the item was returned",
      linkUrl: `/rentals`,
    }).catch(() => {});

    return { success: true };
  } catch (error) {
    console.error("Failed to mark rental as returned:", error);
    return { error: "Failed to mark rental as returned. Please try again." };
  }
}

/**
 * Complete a returned rental. Only the listing owner can complete.
 * Atomically updates rental status and creates a "completed" RentalEvent.
 */
export async function completeRental(rentalId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in." };
  }

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: { ownerId: true, renterId: true, status: true, listing: { select: { title: true } } },
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
    await prisma.$transaction([
      prisma.rental.update({
        where: { id: rentalId },
        data: { status: "completed" },
      }),
      prisma.rentalEvent.create({
        data: {
          rentalId,
          status: "completed",
          actorId: session.user.id,
        },
      }),
    ]);

    revalidatePath("/rentals");

    createNotification({
      recipientId: rental.renterId,
      actorId: session.user.id,
      type: "rental",
      title: `Your rental of '${rental.listing.title}' is now complete`,
      message: "The rental has been completed successfully",
      linkUrl: `/rentals`,
    }).catch(() => {});

    return { success: true };
  } catch (error) {
    console.error("Failed to complete rental:", error);
    return { error: "Failed to complete rental. Please try again." };
  }
}

/**
 * Process a simulated payment for an approved rental.
 * Creates a Payment record, transitions rental to "active", creates RentalEvent, and notifies owner.
 */
export async function processPayment(
  rentalId: string,
  cardData: PaymentFormValues
) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in." };
  }

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: {
      renterId: true,
      ownerId: true,
      status: true,
      totalPrice: true,
      securityDeposit: true,
      listing: { select: { title: true } },
    },
  });

  if (!rental) {
    return { error: "Rental not found." };
  }

  if (rental.renterId !== session.user.id) {
    return { error: "Only the renter can make payment." };
  }

  if (rental.status !== "approved") {
    return { error: "This rental cannot be paid in its current state." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          rentalId,
          method: "card",
          cardLast4: cardData.cardNumber.slice(-4),
          amount: rental.totalPrice + rental.securityDeposit,
          status: "paid",
        },
      });

      await tx.rental.update({
        where: { id: rentalId },
        data: { status: "active" },
      });

      await tx.rentalEvent.create({
        data: {
          rentalId,
          status: "active",
          actorId: session.user.id,
        },
      });
    });

    revalidatePath("/rentals");
    revalidatePath(`/rentals/${rentalId}`);

    createNotification({
      recipientId: rental.ownerId,
      actorId: session.user.id,
      type: "rental",
      title: `Payment received for '${rental.listing.title}'`,
      message: "The renter has completed payment. The rental is now active.",
      linkUrl: `/rentals`,
    }).catch(() => {});

    return { success: true };
  } catch (error) {
    console.error("Failed to process payment:", error);
    return { error: "Failed to process payment. Please try again." };
  }
}

/**
 * Open a dispute on an active or returned rental.
 * Either the renter or owner can initiate. Freezes the rental in "disputed" status
 * until an admin resolves it. Captures previousStatus for later restoration.
 */
export async function openDispute(rentalId: string, reason: string) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in." };
  }

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: {
      renterId: true,
      ownerId: true,
      status: true,
      listing: { select: { title: true } },
    },
  });

  if (!rental) {
    return { error: "Rental not found." };
  }

  // Only renter or owner can open a dispute
  if (
    session.user.id !== rental.renterId &&
    session.user.id !== rental.ownerId
  ) {
    return { error: "Only the renter or owner can open a dispute." };
  }

  // Disputes can only be opened on active or returned rentals
  if (rental.status !== "active" && rental.status !== "returned") {
    return {
      error: "Disputes can only be opened on active or returned rentals.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.dispute.create({
        data: {
          rentalId,
          openedById: session.user.id,
          reason,
          previousStatus: rental.status,
        },
      });

      await tx.rental.update({
        where: { id: rentalId },
        data: { status: "disputed" },
      });

      await tx.rentalEvent.create({
        data: {
          rentalId,
          status: "disputed",
          actorId: session.user.id,
        },
      });
    });

    revalidatePath("/rentals");
    revalidatePath(`/rentals/${rentalId}`);

    // Notify the other party (fire-and-forget)
    const recipientId =
      session.user.id === rental.renterId
        ? rental.ownerId
        : rental.renterId;

    createNotification({
      recipientId,
      actorId: session.user.id,
      type: "rental",
      title: `${session.user.name} opened a dispute on '${rental.listing.title}'`,
      message:
        "A dispute has been opened. An admin will review and resolve it.",
      linkUrl: "/rentals",
    }).catch(() => {});

    return { success: true };
  } catch (error) {
    console.error("Failed to open dispute:", error);
    return { error: "Failed to open dispute. Please try again." };
  }
}

/**
 * QR Handoff: verifies the handoff code matches.
 * confirmPickup is called AFTER payment (when status is already "active") to
 * record that the physical handoff happened. It creates a RentalEvent("picked_up")
 * for the audit trail but does NOT change the rental status.
 */
export async function confirmPickup(rentalId: string, code: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: { status: true, handoffCode: true, renterId: true, ownerId: true },
  });

  if (!rental) return { error: "Rental not found" };
  if (rental.status !== "active") return { error: "Rental must be active (paid) first" };
  if (rental.renterId !== session.user.id) return { error: "Only the renter can confirm pickup" };
  if (rental.handoffCode !== code) return { error: "Invalid handoff code" };

  await prisma.rentalEvent.create({
    data: { rentalId, status: "picked_up", actorId: session.user.id },
  });

  revalidatePath("/rentals");
  return { success: true };
}

/**
 * QR-verified return — transitions rental to "returned" status.
 */
export async function confirmReturn(rentalId: string, code: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: { status: true, handoffCode: true, renterId: true, ownerId: true },
  });

  if (!rental) return { error: "Rental not found" };
  if (rental.status !== "active") return { error: "Rental must be active" };
  if (rental.ownerId !== session.user.id) return { error: "Only the owner can confirm return" };
  if (rental.handoffCode !== code) return { error: "Invalid handoff code" };

  await prisma.$transaction([
    prisma.rental.update({
      where: { id: rentalId },
      data: { status: "returned" },
    }),
    prisma.rentalEvent.create({
      data: { rentalId, status: "returned", actorId: session.user.id },
    }),
  ]);

  revalidatePath("/rentals");
  return { success: true };
}
