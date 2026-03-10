import { prisma } from "@/lib/db";

export async function getAvailabilityBlocks(listingId: string) {
  return prisma.availabilityBlock.findMany({
    where: { listingId },
    orderBy: { startDate: "asc" },
  });
}

export async function getBlockedDatesForListing(listingId: string) {
  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      listingId,
      endDate: { gte: new Date() },
    },
    select: { startDate: true, endDate: true },
  });
  return blocks;
}
