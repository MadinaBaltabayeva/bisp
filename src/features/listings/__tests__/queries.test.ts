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

import { searchListings, getListingById, getUserListings } from "../queries";

describe("listing queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    mockFindUnique.mockResolvedValue(null);
  });

  describe("search", () => {
    it("returns active listings matching keyword in title", async () => {
      mockFindMany.mockResolvedValue([
        { id: "1", title: "Power Drill", status: "active" },
      ]);

      await searchListings({ q: "drill", sort: "date" });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "active",
            OR: expect.arrayContaining([
              { title: { contains: "drill" } },
            ]),
          }),
        })
      );
    });

    it("returns active listings matching keyword in description", async () => {
      await searchListings({ q: "power", sort: "date" });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { description: { contains: "power" } },
            ]),
          }),
        })
      );
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

    it("combines keyword search with category filter", async () => {
      await searchListings({
        q: "drill",
        category: "tools",
        sort: "date",
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "active",
            category: { slug: "tools" },
            OR: expect.arrayContaining([
              { title: { contains: "drill" } },
            ]),
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

      const results = await searchListings({
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
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
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
  });
});
