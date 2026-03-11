import { prisma } from "@/lib/db";

export async function getOwnerStats(userId: string) {
  const [
    totalListings,
    activeListings,
    totalRentals,
    completedRentals,
    totalRevenue,
    averageRating,
  ] = await Promise.all([
    prisma.listing.count({ where: { ownerId: userId } }),
    prisma.listing.count({ where: { ownerId: userId, status: "active" } }),
    prisma.rental.count({ where: { ownerId: userId } }),
    prisma.rental.count({
      where: { ownerId: userId, status: "completed" },
    }),
    prisma.rental.aggregate({
      where: { ownerId: userId, status: { in: ["completed", "active", "returned"] } },
      _sum: { totalPrice: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { averageRating: true, reviewCount: true },
    }),
  ]);

  const bookingRate = totalRentals > 0
    ? Math.round((completedRentals / totalRentals) * 100)
    : 0;

  return {
    totalListings,
    activeListings,
    totalRentals,
    completedRentals,
    totalRevenue: totalRevenue._sum.totalPrice || 0,
    averageRating: averageRating?.averageRating || 0,
    reviewCount: averageRating?.reviewCount || 0,
    bookingRate,
  };
}

export async function getMonthlyRevenue(userId: string) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const rentals = await prisma.rental.findMany({
    where: {
      ownerId: userId,
      status: { in: ["completed", "active", "returned"] },
      createdAt: { gte: sixMonthsAgo },
    },
    select: { totalPrice: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const monthlyData: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyData[key] = 0;
  }

  for (const rental of rentals) {
    const d = new Date(rental.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthlyData) {
      monthlyData[key] += rental.totalPrice;
    }
  }

  return Object.entries(monthlyData).map(([month, revenue]) => ({
    month,
    revenue: Math.round(revenue),
  }));
}

export async function getTopListings(userId: string) {
  const listings = await prisma.listing.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      title: true,
      images: { where: { isCover: true }, take: 1, select: { url: true } },
      _count: { select: { rentals: true, favorites: true } },
    },
    orderBy: { rentals: { _count: "desc" } },
    take: 5,
  });

  return listings.map((l) => ({
    id: l.id,
    title: l.title,
    coverImage: l.images[0]?.url || null,
    rentalCount: l._count.rentals,
    favoriteCount: l._count.favorites,
  }));
}
