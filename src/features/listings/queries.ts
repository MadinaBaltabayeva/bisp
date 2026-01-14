import { prisma } from "@/lib/db";
import type { SearchParams } from "@/lib/validations/listing";

/**
 * Compute Haversine distance between two points in miles.
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Search listings with filters, keyword search, location radius, and sorting.
 */
export async function searchListings(params: SearchParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    status: "active",
  };

  // Keyword search on title and description
  if (params.q) {
    where.OR = [
      { title: { contains: params.q } },
      { description: { contains: params.q } },
    ];
  }

  // Category filter by slug
  if (params.category) {
    where.category = { slug: params.category };
  }

  // Price range filter on priceDaily
  if (params.minPrice != null || params.maxPrice != null) {
    where.priceDaily = {};
    if (params.minPrice != null) {
      where.priceDaily.gte = params.minPrice;
    }
    if (params.maxPrice != null) {
      where.priceDaily.lte = params.maxPrice;
    }
  }

  // Region filter
  if (params.region) {
    where.region = params.region;
  }

  // Bounding box filter for radius search
  const hasGeoFilter =
    params.latitude != null &&
    params.longitude != null &&
    params.radius != null;

  if (hasGeoFilter) {
    const lat = params.latitude!;
    const lng = params.longitude!;
    const radiusMiles = params.radius!;

    // 1 degree latitude ~ 69 miles
    const latDelta = radiusMiles / 69;
    // 1 degree longitude ~ 69 * cos(lat) miles
    const lngDelta = radiusMiles / (69 * Math.cos((lat * Math.PI) / 180));

    where.latitude = {
      gte: lat - latDelta,
      lte: lat + latDelta,
    };
    where.longitude = {
      gte: lng - lngDelta,
      lte: lng + lngDelta,
    };
  }

  // Dynamic sort
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any;
  switch (params.sort) {
    case "price_asc":
      orderBy = { priceDaily: "asc" };
      break;
    case "price_desc":
      orderBy = { priceDaily: "desc" };
      break;
    case "relevance":
    case "date":
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  const listings = await prisma.listing.findMany({
    where,
    orderBy,
    include: {
      images: {
        where: { isCover: true },
        take: 1,
      },
      category: true,
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // Post-filter by exact Haversine distance to exclude corners of bounding box
  if (hasGeoFilter) {
    const lat = params.latitude!;
    const lng = params.longitude!;
    const radiusMiles = params.radius!;

    return listings.filter((listing) => {
      if (listing.latitude == null || listing.longitude == null) return false;
      const distance = haversineDistance(
        lat,
        lng,
        listing.latitude,
        listing.longitude
      );
      return distance <= radiusMiles;
    });
  }

  return listings;
}

/**
 * Get a single listing by ID with all images, category, and owner details.
 */
export async function getListingById(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
      category: true,
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          location: true,
          averageRating: true,
          reviewCount: true,
          createdAt: true,
        },
      },
    },
  });
}

/**
 * Get all listings for a specific user.
 */
export async function getUserListings(userId: string) {
  return prisma.listing.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      images: {
        where: { isCover: true },
        take: 1,
      },
      category: true,
    },
  });
}
