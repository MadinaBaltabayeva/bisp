import { prisma } from "@/lib/db";

/**
 * Get the dispute for a specific rental (if one exists).
 */
export async function getDisputeForRental(rentalId: string) {
  return prisma.dispute.findUnique({
    where: { rentalId },
    include: {
      openedBy: { select: { name: true } },
    },
  });
}

/**
 * Get all open disputes, ordered by oldest first (FIFO queue).
 * Includes rental details, parties, and opener info for admin display.
 */
export async function getOpenDisputes() {
  return prisma.dispute.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "asc" },
    include: {
      rental: {
        include: {
          listing: {
            select: {
              title: true,
              images: { where: { isCover: true }, take: 1 },
            },
          },
          renter: { select: { id: true, name: true, image: true } },
          owner: { select: { id: true, name: true, image: true } },
        },
      },
      openedBy: { select: { name: true } },
    },
  });
}
