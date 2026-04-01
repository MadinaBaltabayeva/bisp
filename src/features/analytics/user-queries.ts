import { prisma } from "@/lib/db";

// === Per-Listing Analytics ===

export async function getListingAnalytics(userId: string) {
  const listings = await prisma.listing.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      title: true,
      status: true,
      images: { where: { isCover: true }, take: 1, select: { url: true } },
      _count: { select: { rentals: true, favorites: true, conversations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Batch fetch analytics events for all listing IDs
  const listingIds = listings.map((l) => l.id);

  const [viewCounts, impressionCounts] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ["listingId"],
      where: { listingId: { in: listingIds }, type: "listing_view" },
      _count: true,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["listingId"],
      where: { listingId: { in: listingIds }, type: "search_impression" },
      _count: true,
    }),
  ]);

  const viewMap = new Map(viewCounts.map((v) => [v.listingId, v._count]));
  const impMap = new Map(impressionCounts.map((v) => [v.listingId, v._count]));

  return listings.map((l) => {
    const views = viewMap.get(l.id) || 0;
    const impressions = impMap.get(l.id) || 0;
    const ctr = impressions > 0 ? Math.round((views / impressions) * 100 * 10) / 10 : 0;
    const inquiryRate = views > 0 ? Math.round((l._count.conversations / views) * 100 * 10) / 10 : 0;

    return {
      id: l.id,
      title: l.title,
      status: l.status,
      coverImage: l.images[0]?.url || null,
      views,
      impressions,
      ctr,
      favorites: l._count.favorites,
      rentals: l._count.rentals,
      inquiries: l._count.conversations,
      inquiryRate,
    };
  });
}

// === User Aggregate Stats ===

export async function getUserAnalyticsStats(userId: string) {
  const [
    totalViews,
    totalImpressions,
    profileViews,
    totalFavorites,
    totalRentals,
    completedRentals,
  ] = await Promise.all([
    prisma.analyticsEvent.count({
      where: { userId, type: "listing_view" },
    }),
    prisma.analyticsEvent.count({
      where: { userId, type: "search_impression" },
    }),
    prisma.analyticsEvent.count({
      where: { userId, type: "profile_view" },
    }),
    prisma.favorite.count({
      where: { listing: { ownerId: userId } },
    }),
    prisma.rental.count({
      where: { ownerId: userId },
    }),
    prisma.rental.count({
      where: { ownerId: userId, status: "completed" },
    }),
  ]);

  const overallCtr = totalImpressions > 0
    ? Math.round((totalViews / totalImpressions) * 100 * 10) / 10
    : 0;

  const conversionRate = totalViews > 0
    ? Math.round((totalRentals / totalViews) * 100 * 10) / 10
    : 0;

  return {
    totalViews,
    totalImpressions,
    profileViews,
    totalFavorites,
    overallCtr,
    conversionRate,
    completionRate: totalRentals > 0
      ? Math.round((completedRentals / totalRentals) * 100)
      : 0,
  };
}

// === Response Time ===

export async function getAverageResponseTime(userId: string) {
  // Find conversations where this user is a participant
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    select: {
      id: true,
      user1Id: true,
      user2Id: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 10,
        select: { senderId: true, createdAt: true },
      },
    },
  });

  const responseTimes: number[] = [];

  for (const conv of conversations) {
    const messages = conv.messages;
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1];
      const curr = messages[i];
      // If the previous message was from someone else and this user replied
      if (prev.senderId !== userId && curr.senderId === userId) {
        const diff = curr.createdAt.getTime() - prev.createdAt.getTime();
        // Only count responses under 24h (ignore abandoned convos)
        if (diff < 24 * 60 * 60 * 1000) {
          responseTimes.push(diff);
        }
      }
    }
  }

  if (responseTimes.length === 0) return null;

  const avgMs = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const avgMinutes = Math.round(avgMs / (1000 * 60));

  return avgMinutes; // in minutes
}

// === Views Over Time (for chart) ===

export async function getViewsOverTime(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      userId,
      type: { in: ["listing_view", "search_impression"] },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { type: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Build daily buckets
  const buckets: Record<string, { views: number; impressions: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { views: 0, impressions: 0 };
  }

  for (const e of events) {
    const key = e.createdAt.toISOString().slice(0, 10);
    if (!(key in buckets)) continue;
    if (e.type === "listing_view") buckets[key].views++;
    else buckets[key].impressions++;
  }

  return Object.entries(buckets).map(([date, data]) => ({
    date,
    views: data.views,
    impressions: data.impressions,
  }));
}

// === Most Popular Listing ===

export async function getMostPopularListing(userId: string) {
  const result = await prisma.analyticsEvent.groupBy({
    by: ["listingId"],
    where: { userId, type: "listing_view", listingId: { not: null } },
    _count: true,
    orderBy: { _count: { listingId: "desc" } },
    take: 1,
  });

  if (result.length === 0 || !result[0].listingId) return null;

  const listing = await prisma.listing.findUnique({
    where: { id: result[0].listingId },
    select: {
      id: true,
      title: true,
      images: { where: { isCover: true }, take: 1, select: { url: true } },
    },
  });

  if (!listing) return null;

  return {
    id: listing.id,
    title: listing.title,
    coverImage: listing.images[0]?.url || null,
    views: result[0]._count,
  };
}
