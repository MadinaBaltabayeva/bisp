import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/queries";

/**
 * Get platform-wide statistics for the admin dashboard.
 */
export async function getAdminStats() {
  const [totalUsers, totalListings, totalRentals, flaggedCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.listing.count({ where: { status: "active" } }),
      prisma.rental.count(),
      prisma.listing.count({ where: { status: "under_review" } }),
    ]);
  return { totalUsers, totalListings, totalRentals, flaggedCount };
}

const PAGE_SIZE = 20;

/**
 * Get paginated list of users for admin management.
 * Supports search by name/email and filter by suspension status.
 */
export async function getAdminUsers(params: {
  page?: number;
  search?: string;
  status?: "active" | "suspended";
}) {
  const page = params.page ?? 1;
  const where: Record<string, unknown> = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { email: { contains: params.search } },
    ];
  }

  if (params.status === "suspended") {
    where.isSuspended = true;
  } else if (params.status === "active") {
    where.isSuspended = false;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isSuspended: true,
        idVerified: true,
        createdAt: true,
        _count: { select: { listings: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, pageSize: PAGE_SIZE };
}

/**
 * Get all flagged (under_review) listings for the moderation queue.
 */
export async function getFlaggedListings() {
  const listings = await prisma.listing.findMany({
    where: { status: "under_review" },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, email: true } },
      images: { where: { isCover: true }, take: 1 },
      category: { select: { name: true } },
    },
  });
  return listings;
}

type ActivityItem = { type: string; description: string; timestamp: Date };

/**
 * Get a unified activity feed of recent platform events.
 * Aggregates last 10 from users, listings, rentals, reviews; merges and sorts by timestamp.
 */
export async function getActivityFeed() {
  const [recentUsers, recentListings, recentRentals, recentReviews] =
    await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, name: true, createdAt: true },
      }),
      prisma.listing.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          createdAt: true,
          status: true,
        },
      }),
      prisma.rental.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          renter: { select: { name: true } },
          listing: { select: { title: true } },
        },
      }),
      prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { reviewer: { select: { name: true } } },
      }),
    ]);

  const feed: ActivityItem[] = [
    ...recentUsers.map((u) => ({
      type: "user_joined",
      description: `${u.name} joined`,
      timestamp: u.createdAt,
    })),
    ...recentListings.map((l) => ({
      type: "listing_created",
      description: `"${l.title}" listed`,
      timestamp: l.createdAt,
    })),
    ...recentRentals.map((r) => ({
      type: "rental_requested",
      description: `${r.renter.name} requested "${r.listing.title}"`,
      timestamp: r.createdAt,
    })),
    ...recentReviews.map((r) => ({
      type: "review_left",
      description: `${r.reviewer.name} left a review`,
      timestamp: r.createdAt,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  return feed;
}

/**
 * Check if the current user is suspended.
 * Returns { error } if suspended, empty object otherwise.
 * Used as a guard in mutation Server Actions.
 */
export async function checkNotSuspended(): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuspended: true },
  });

  if (user?.isSuspended) return { error: "Your account is suspended." };
  return {};
}
