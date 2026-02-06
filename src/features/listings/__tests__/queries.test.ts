import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    listing: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

// Mock FTS5 search module
const mockFtsSearch = vi.fn();
const mockGetDictionary = vi.fn();
const mockEnsureFtsTable = vi.fn();

vi.mock("@/lib/search", () => ({
  ftsSearch: (...args: unknown[]) => mockFtsSearch(...args),
  getDictionary: (...args: unknown[]) => mockGetDictionary(...args),
  ensureFtsTable: (...args: unknown[]) => mockEnsureFtsTable(...args),
}));

// Mock search-utils (use real implementations for buildFtsQuery)
vi.mock("../search-utils", async () => {
  const actual =
    await vi.importActual<typeof import("../search-utils")>("../search-utils");
  return {
    ...actual,
    // Keep real implementations for all functions
  };
});

import { searchListings, getListingById, getUserListings } from "../queries";

describe("listing queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    mockFindUnique.mockResolvedValue(null);
    mockFtsSearch.mockResolvedValue([]);
    mockGetDictionary.mockResolvedValue([]);
  });

  describe("search - FTS5 path", () => {
    it("uses FTS5 two-step query when q is provided", async () => {
      mockFtsSearch.mockResolvedValue([
        { listing_id: "1", rank: -5 },
      ]);
      mockFindMany.mockResolvedValue([
        { id: "1", title: "Power Drill", status: "active" },
      ]);

      const result = await searchListings({ q: "drill", sort: "date" });

      // Step 1: FTS5 search called
      expect(mockFtsSearch).toHaveBeenCalledWith('"drill"*');

      // Step 2: Prisma called with matched IDs
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "active",
            id: { in: ["1"] },
          }),
        })
      );

      // Returns new shape
      expect(result.listings).toHaveLength(1);
      expect(result.suggestion).toBeNull();
      expect(result.highlightTerms).toEqual(["drill"]);
    });

    it("returns suggestion when FTS5 finds no results", async () => {
      mockFtsSearch.mockResolvedValue([]);
      mockGetDictionary.mockResolvedValue(["bicycle", "car", "drill"]);

      const result = await searchListings({ q: "bycicle", sort: "date" });

      expect(mockFtsSearch).toHaveBeenCalled();
      expect(mockGetDictionary).toHaveBeenCalled();
      expect(result.listings).toHaveLength(0);
      expect(result.suggestion).toBe("bicycle");
      expect(result.highlightTerms).toEqual([]);
    });

    it("preserves FTS5 rank order for relevance sort", async () => {
      mockFtsSearch.mockResolvedValue([
        { listing_id: "2", rank: -10 },
        { listing_id: "1", rank: -5 },
      ]);
      mockFindMany.mockResolvedValue([
        { id: "1", title: "Drill", status: "active" },
        { id: "2", title: "Power Drill Kit", status: "active" },
      ]);

      const result = await searchListings({ q: "drill", sort: "relevance" });

      // ID "2" has better rank (-10 < -5), should be first
      expect(result.listings[0].id).toBe("2");
      expect(result.listings[1].id).toBe("1");
    });

    it("returns highlightTerms when query has results", async () => {
      mockFtsSearch.mockResolvedValue([
        { listing_id: "1", rank: -5 },
      ]);
      mockFindMany.mockResolvedValue([
        { id: "1", title: "Power Drill", status: "active" },
      ]);

      const result = await searchListings({
        q: "power drill",
        sort: "date",
      });

      expect(result.highlightTerms).toEqual(["power", "drill"]);
    });

    it("combines FTS5 results with category filter", async () => {
      mockFtsSearch.mockResolvedValue([
        { listing_id: "1", rank: -5 },
      ]);
      mockFindMany.mockResolvedValue([
        { id: "1", title: "Power Drill", status: "active" },
      ]);

      await searchListings({
        q: "drill",
        category: "tools",
        sort: "date",
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "active",
            id: { in: ["1"] },
            category: { slug: "tools" },
          }),
        })
      );
    });
  });

  describe("search - Prisma-only path", () => {
    it("falls back to Prisma-only when no query", async () => {
      await searchListings({ sort: "date" });

      // FTS5 should NOT be called
      expect(mockFtsSearch).not.toHaveBeenCalled();

      // Prisma should be called directly
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "active",
          }),
        })
      );
    });

    it("returns { listings, suggestion: null, highlightTerms: [] } for no-query path", async () => {
      mockFindMany.mockResolvedValue([
        { id: "1", title: "Drill", status: "active" },
      ]);

      const result = await searchListings({ sort: "date" });

      expect(result.listings).toHaveLength(1);
      expect(result.suggestion).toBeNull();
      expect(result.highlightTerms).toEqual([]);
    });

    it("excludes non-active listings from results", async () => {
      await searchListings({ sort: "date" });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "active",
          }),
        })
      );
    });
  });

  describe("filter", () => {
    it("filters listings by category slug", async () => {
      await searchListings({ category: "tools", sort: "date" });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { slug: "tools" },
          }),
        })
      );
    });

    it("filters listings by minimum price", async () => {
      await searchListings({ minPrice: 10, sort: "date" });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priceDaily: expect.objectContaining({ gte: 10 }),
          }),
        })
      );
    });

    it("filters listings by maximum price", async () => {
      await searchListings({ maxPrice: 50, sort: "date" });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priceDaily: expect.objectContaining({ lte: 50 }),
          }),
        })
      );
    });

    it("filters listings by price range (min and max)", async () => {
      await searchListings({ minPrice: 10, maxPrice: 50, sort: "date" });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priceDaily: { gte: 10, lte: 50 },
          }),
        })
      );
    });
  });

  describe("location", () => {
    it("filters listings by region", async () => {
      await searchListings({ region: "Bay Area", sort: "date" });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            region: "Bay Area",
          }),
        })
      );
    });

    it("filters listings by radius when lat/lng and radius provided", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "1",
          latitude: 37.78,
          longitude: -122.42,
          status: "active",
        },
        {
          id: "2",
          latitude: 40.0,
          longitude: -120.0,
          status: "active",
        },
      ]);

      const result = await searchListings({
        latitude: 37.7749,
        longitude: -122.4194,
        radius: 10,
        sort: "date",
      });

      // Should include bounding box in where clause
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            latitude: expect.objectContaining({
              gte: expect.any(Number),
              lte: expect.any(Number),
            }),
            longitude: expect.objectContaining({
              gte: expect.any(Number),
              lte: expect.any(Number),
            }),
          }),
        })
      );

      // Post-filter should keep nearby listing and exclude distant one
      expect(result.listings).toHaveLength(1);
      expect(result.listings[0].id).toBe("1");
    });
  });

  describe("sort", () => {
    it("sorts by date descending by default", async () => {
      await searchListings({ sort: "date" });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });

    it("sorts by price ascending", async () => {
      await searchListings({ sort: "price_asc" });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { priceDaily: "asc" },
        })
      );
    });

    it("sorts by price descending", async () => {
      await searchListings({ sort: "price_desc" });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { priceDaily: "desc" },
        })
      );
    });

    it("uses price sort even with FTS5 results", async () => {
      mockFtsSearch.mockResolvedValue([
        { listing_id: "1", rank: -5 },
      ]);
      mockFindMany.mockResolvedValue([
        { id: "1", title: "Drill", status: "active", priceDaily: 10 },
      ]);

      await searchListings({ q: "drill", sort: "price_asc" });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { priceDaily: "asc" },
        })
      );
    });
  });
});
