import { prisma } from "@/lib/db";
import type { SearchParams } from "@/lib/validations/listing";
import { ftsSearch, getDictionary } from "@/lib/search";
import {
  buildFtsQuery,
  suggestCorrection,
  extractHighlightTerms,
} from "./search-utils";

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

/** Shared include clause for listing queries */
const LISTING_INCLUDE = {
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
      idVerified: true,
    },
  },
} as const;

/** Listing type with relations included by search queries */
type ListingWithRelations = Awaited<
  ReturnType<typeof prisma.listing.findMany<{ include: typeof LISTING_INCLUDE }>>
>[number];

/** Return type for searchListings */
export interface SearchListingsResult {
  listings: ListingWithRelations[];
  suggestion: string | null;
  highlightTerms: string[];
}

/**
 * Search listings with FTS5 full-text search, filters, location radius, and sorting.
 *
 * When `params.q` is provided, uses FTS5 two-step query:
 * 1. FTS5 returns ranked listing IDs via BM25
 * 2. Prisma fetches full data with filters applied
 *
 * When no query, falls back to Prisma-only path.
 */
export async function searchListings(
  params: SearchParams
): Promise<SearchListingsResult> {
  // Build filter conditions (shared between FTS5 and Prisma-only paths)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    status: "active", // "unavailable" listings excluded by this filter
  };

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

    const latDelta = radiusMiles / 69;
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

  // FTS5 path: when search query is provided
  if (params.q) {
    const ftsQuery = buildFtsQuery(params.q);

    // If query builder returns empty (all stopwords/empty input), fall through to Prisma-only
    if (ftsQuery) {
      const ftsResults = await ftsSearch(ftsQuery);

      // No results: suggest correction
      if (ftsResults.length === 0) {
        const dictionary = await getDictionary();
        const suggestion = suggestCorrection(params.q, dictionary);
        return { listings: [], suggestion, highlightTerms: [] };
      }

      // Combine FTS5 IDs with Prisma filters
      const matchedIds = ftsResults.map((r) => r.listing_id);
      where.id = { in: matchedIds };

      // Determine sort: for price sorts, let Prisma handle; for relevance/date, re-sort by FTS rank
      const usePriceSort =
        params.sort === "price_asc" || params.sort === "price_desc";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let orderBy: any;
      if (usePriceSort) {
        orderBy =
          params.sort === "price_asc"
            ? { priceDaily: "asc" }
            : { priceDaily: "desc" };
      } else {
        // For relevance and date sort with query, we re-sort by FTS rank after fetch
        orderBy = undefined;
      }

      const listings = await prisma.listing.findMany({
        where,
        ...(orderBy ? { orderBy } : {}),
        include: LISTING_INCLUDE,
      });

      // Apply Haversine post-filter
      let filteredListings = listings;
      if (hasGeoFilter) {
        const lat = params.latitude!;
        const lng = params.longitude!;
        const radiusMiles = params.radius!;
        filteredListings = listings.filter((listing) => {
          if (listing.latitude == null || listing.longitude == null)
            return false;
          return (
            haversineDistance(lat, lng, listing.latitude, listing.longitude) <=
            radiusMiles
          );
        });
      }

      // Re-sort by FTS5 BM25 rank (more negative = better) for relevance sort
      if (!usePriceSort) {
        const rankMap = new Map(
          ftsResults.map((r) => [r.listing_id, r.rank])
        );
        filteredListings.sort(
          (a, b) => (rankMap.get(a.id) ?? 0) - (rankMap.get(b.id) ?? 0)
        );
      }

      return {
        listings: filteredListings,
        suggestion: null,
        highlightTerms: extractHighlightTerms(params.q),
      };
    }
  }

  // Prisma-only path: no query or empty FTS query
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
    include: LISTING_INCLUDE,
  });

  // Post-filter by exact Haversine distance
  if (hasGeoFilter) {
    const lat = params.latitude!;
    const lng = params.longitude!;
    const radiusMiles = params.radius!;

    return {
      listings: listings.filter((listing) => {
        if (listing.latitude == null || listing.longitude == null) return false;
        return (
          haversineDistance(lat, lng, listing.latitude, listing.longitude) <=
          radiusMiles
        );
      }),
      suggestion: null,
      highlightTerms: [],
    };
  }

  return { listings, suggestion: null, highlightTerms: [] };
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
          idVerified: true,
        },
      },
    },
  });
}

/**
 * Get a cached translation for a listing in a specific locale.
 * Returns null if no cached translation exists.
 */
export async function getCachedTranslation(listingId: string, locale: string) {
  return prisma.listingTranslation.findUnique({
    where: { listingId_locale: { listingId, locale } },
    select: {
      translatedTitle: true,
      translatedDescription: true,
      detectedLanguage: true,
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
