import { prisma } from "@/lib/db";

/**
 * Get all rentals where the user is the renter.
 */
export async function getRentalsAsRenter(userId: string) {
  return prisma.rental.findMany({
    where: { renterId: userId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          images: {
            where: { isCover: true },
            take: 1,
            select: { url: true },
          },
        },
      },
      owner: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get all rentals where the user is the listing owner.
 */
export async function getRentalsAsOwner(userId: string) {
  return prisma.rental.findMany({
    where: { ownerId: userId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          images: {
            where: { isCover: true },
            take: 1,
            select: { url: true },
          },
        },
      },
      renter: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single rental by ID with full details.
 */
export async function getRentalById(id: string) {
  return prisma.rental.findUnique({
    where: { id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          images: {
            where: { isCover: true },
            take: 1,
            select: { url: true },
          },
        },
      },
      renter: {
        select: { id: true, name: true, image: true },
      },
      owner: {
        select: { id: true, name: true, image: true },
      },
    },
  });
}

/**
 * Get counts of rentals needing attention for badge display.
 */
export async function getPendingActionCount(userId: string) {
  const [asOwner, asRenter] = await Promise.all([
    prisma.rental.count({
      where: { ownerId: userId, status: "requested" },
    }),
    prisma.rental.count({
      where: { renterId: userId, status: "approved" },
    }),
  ]);

  return { asOwner, asRenter };
}

/**
 * Get a single rental by ID with full details including events for timeline.
 */
export async function getRentalWithEvents(id: string) {
  return prisma.rental.findUnique({
    where: { id },
    include: {
      listing: {
        include: {
          images: { where: { isCover: true }, take: 1 },
          category: true,
        },
      },
      renter: { select: { id: true, name: true, image: true } },
      owner: { select: { id: true, name: true, image: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
}

/**
 * Get the payment record for a rental (if exists).
 */
export async function getPaymentForRental(rentalId: string) {
  return prisma.payment.findUnique({ where: { rentalId } });
}

