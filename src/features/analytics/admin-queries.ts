import { prisma } from "@/lib/db";

type Period = "7d" | "30d" | "6m" | "all";

interface DateRange {
  from: Date;
  to: Date;
}

export function parsePeriod(
  period?: string,
  from?: string,
  to?: string
): DateRange {
  const now = new Date();
  const end = to ? new Date(to) : now;

  if (from) {
    return { from: new Date(from), to: end };
  }

  switch (period) {
    case "7d": {
      const d = new Date(end);
      d.setDate(d.getDate() - 7);
      return { from: d, to: end };
    }
    case "6m": {
      const d = new Date(end);
      d.setMonth(d.getMonth() - 6);
      return { from: d, to: end };
    }
    case "all":
      return { from: new Date("2020-01-01"), to: end };
    case "30d":
    default: {
      const d = new Date(end);
      d.setDate(d.getDate() - 30);
      return { from: d, to: end };
    }
  }
}

function getPreviousPeriod(range: DateRange): DateRange {
  const duration = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - duration),
    to: new Date(range.from.getTime()),
  };
}

function trendPercent(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

// === KPI Stats ===

export async function getAnalyticsKPIs(range: DateRange) {
  const prev = getPreviousPeriod(range);

  const [cur, prv] = await Promise.all([
    fetchKPIData(range),
    fetchKPIData(prev),
  ]);

  return {
    newUsers: { value: cur.newUsers, trend: trendPercent(cur.newUsers, prv.newUsers) },
    newListings: { value: cur.newListings, trend: trendPercent(cur.newListings, prv.newListings) },
    totalRentals: { value: cur.totalRentals, trend: trendPercent(cur.totalRentals, prv.totalRentals) },
    revenue: { value: cur.revenue, trend: trendPercent(cur.revenue, prv.revenue) },
    avgRating: { value: cur.avgRating, trend: trendPercent(cur.avgRating, prv.avgRating) },
    completionRate: { value: cur.completionRate, trend: trendPercent(cur.completionRate, prv.completionRate) },
  };
}

async function fetchKPIData(range: DateRange) {
  const [newUsers, newListings, totalRentals, completedRentals, revenueAgg, ratingAgg] =
    await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: range.from, lte: range.to } },
      }),
      prisma.listing.count({
        where: { createdAt: { gte: range.from, lte: range.to } },
      }),
      prisma.rental.count({
        where: { createdAt: { gte: range.from, lte: range.to } },
      }),
      prisma.rental.count({
        where: {
          createdAt: { gte: range.from, lte: range.to },
          status: "completed",
        },
      }),
      prisma.rental.aggregate({
        where: {
          createdAt: { gte: range.from, lte: range.to },
          status: { in: ["completed", "active", "returned"] },
        },
        _sum: { totalPrice: true },
      }),
      prisma.review.aggregate({
        where: { createdAt: { gte: range.from, lte: range.to } },
        _avg: { rating: true },
      }),
    ]);

  return {
    newUsers,
    newListings,
    totalRentals,
    completedRentals,
    revenue: Math.round(revenueAgg._sum.totalPrice || 0),
    avgRating: Math.round((ratingAgg._avg.rating || 0) * 10) / 10,
    completionRate:
      totalRentals > 0 ? Math.round((completedRentals / totalRentals) * 100) : 0,
  };
}

// === Time Bucket Helpers ===

type Granularity = "daily" | "weekly" | "monthly";

function getGranularity(range: DateRange): Granularity {
  const days = (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 31) return "daily";
  if (days <= 200) return "weekly";
  return "monthly";
}

function bucketKey(date: Date, granularity: Granularity): string {
  const d = new Date(date);
  if (granularity === "daily") {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }
  if (granularity === "weekly") {
    // Start of week (Monday)
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 7); // YYYY-MM
}

function generateBuckets(range: DateRange, granularity: Granularity): string[] {
  const buckets: string[] = [];
  const current = new Date(range.from);

  while (current <= range.to) {
    const key = bucketKey(current, granularity);
    if (!buckets.includes(key)) buckets.push(key);

    if (granularity === "daily") current.setDate(current.getDate() + 1);
    else if (granularity === "weekly") current.setDate(current.getDate() + 7);
    else current.setMonth(current.getMonth() + 1);
  }

  return buckets;
}

// === User Growth Chart ===

export async function getUserGrowthData(range: DateRange) {
  const granularity = getGranularity(range);
  const buckets = generateBuckets(range, granularity);

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: range.from, lte: range.to } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Count of users before the range for cumulative
  const baseCount = await prisma.user.count({
    where: { createdAt: { lt: range.from } },
  });

  const countMap: Record<string, number> = {};
  for (const b of buckets) countMap[b] = 0;
  for (const u of users) {
    const key = bucketKey(u.createdAt, granularity);
    if (key in countMap) countMap[key]++;
  }

  let cumulative = baseCount;
  return buckets.map((bucket) => {
    cumulative += countMap[bucket] || 0;
    return { bucket, newUsers: countMap[bucket] || 0, cumulative };
  });
}

// === Rental Volume Chart ===

export async function getRentalVolumeData(range: DateRange) {
  const granularity = getGranularity(range);
  const buckets = generateBuckets(range, granularity);

  const rentals = await prisma.rental.findMany({
    where: { createdAt: { gte: range.from, lte: range.to } },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  const data: Record<string, { completed: number; active: number; other: number }> = {};
  for (const b of buckets) data[b] = { completed: 0, active: 0, other: 0 };

  for (const r of rentals) {
    const key = bucketKey(r.createdAt, granularity);
    if (!(key in data)) continue;
    if (r.status === "completed" || r.status === "returned") data[key].completed++;
    else if (r.status === "active" || r.status === "approved" || r.status === "requested") data[key].active++;
    else data[key].other++;
  }

  return buckets.map((bucket) => ({
    bucket,
    completed: data[bucket].completed,
    active: data[bucket].active,
    other: data[bucket].other,
  }));
}

// === Revenue Trend Chart ===

export async function getRevenueTrendData(range: DateRange) {
  const granularity = getGranularity(range);
  const buckets = generateBuckets(range, granularity);

  const rentals = await prisma.rental.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      status: { in: ["completed", "active", "returned"] },
    },
    select: { createdAt: true, totalPrice: true },
    orderBy: { createdAt: "asc" },
  });

  const revenueMap: Record<string, number> = {};
  for (const b of buckets) revenueMap[b] = 0;

  for (const r of rentals) {
    const key = bucketKey(r.createdAt, granularity);
    if (key in revenueMap) revenueMap[key] += r.totalPrice;
  }

  return buckets.map((bucket) => ({
    bucket,
    revenue: Math.round(revenueMap[bucket]),
  }));
}

// === Category Breakdown ===

export async function getCategoryBreakdown(range: DateRange) {
  const listings = await prisma.listing.findMany({
    where: { createdAt: { gte: range.from, lte: range.to } },
    select: { category: { select: { name: true } } },
  });

  const counts: Record<string, number> = {};
  for (const l of listings) {
    counts[l.category.name] = (counts[l.category.name] || 0) + 1;
  }

  const total = listings.length;
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// === Top Earners ===

export async function getTopEarners(range: DateRange, limit = 10) {
  const rentals = await prisma.rental.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      status: { in: ["completed", "active", "returned"] },
    },
    select: {
      totalPrice: true,
      owner: { select: { id: true, name: true, image: true, averageRating: true } },
    },
  });

  const earnerMap: Record<string, {
    id: string;
    name: string;
    image: string | null;
    averageRating: number;
    revenue: number;
    rentalCount: number;
  }> = {};

  for (const r of rentals) {
    if (!earnerMap[r.owner.id]) {
      earnerMap[r.owner.id] = {
        id: r.owner.id,
        name: r.owner.name,
        image: r.owner.image,
        averageRating: r.owner.averageRating,
        revenue: 0,
        rentalCount: 0,
      };
    }
    earnerMap[r.owner.id].revenue += r.totalPrice;
    earnerMap[r.owner.id].rentalCount++;
  }

  return Object.values(earnerMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((e) => ({ ...e, revenue: Math.round(e.revenue) }));
}

// === Conversion Funnel ===

export async function getConversionFunnel(range: DateRange) {
  const [listingsCreated, rentalsRequested, rentalsApproved, rentalsCompleted] =
    await Promise.all([
      prisma.listing.count({
        where: { createdAt: { gte: range.from, lte: range.to } },
      }),
      prisma.rental.count({
        where: { createdAt: { gte: range.from, lte: range.to } },
      }),
      prisma.rental.count({
        where: {
          createdAt: { gte: range.from, lte: range.to },
          status: { in: ["approved", "active", "returned", "completed"] },
        },
      }),
      prisma.rental.count({
        where: {
          createdAt: { gte: range.from, lte: range.to },
          status: "completed",
        },
      }),
    ]);

  const steps = [
    { label: "listingsCreated", value: listingsCreated },
    { label: "rentalRequests", value: rentalsRequested },
    { label: "approved", value: rentalsApproved },
    { label: "completed", value: rentalsCompleted },
  ];

  return steps.map((step, i) => ({
    ...step,
    percentOfPrevious: i === 0 ? 100 : steps[i - 1].value > 0
      ? Math.round((step.value / steps[i - 1].value) * 100)
      : 0,
    percentOfFirst: steps[0].value > 0
      ? Math.round((step.value / steps[0].value) * 100)
      : 0,
  }));
}
