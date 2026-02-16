import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
const mockFavoriteFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    favorite: {
      findMany: (...args: unknown[]) => mockFavoriteFindMany(...args),
    },
  },
}));

import { getUserFavoriteIds, getFavoriteListings } from "../queries";

describe("favorites queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserFavoriteIds", () => {
    it("returns a Set of listing IDs for the user", async () => {
      mockFavoriteFindMany.mockResolvedValue([
        { listingId: "listing_1" },
        { listingId: "listing_2" },
        { listingId: "listing_3" },
      ]);

      const result = await getUserFavoriteIds("user_1");
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(3);
      expect(result.has("listing_1")).toBe(true);
      expect(result.has("listing_2")).toBe(true);
      expect(result.has("listing_3")).toBe(true);

      expect(mockFavoriteFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user_1" },
          select: { listingId: true },
        })
      );
    });

    it("returns empty Set when user has no favorites", async () => {
      mockFavoriteFindMany.mockResolvedValue([]);

      const result = await getUserFavoriteIds("user_1");
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });
  });

  describe("getFavoriteListings", () => {
    it("returns favorites with listing data ordered by createdAt desc", async () => {
      const mockData = [
        {
          id: "fav_1",
          listingId: "listing_1",
          createdAt: new Date("2026-03-08"),
          listing: {
            id: "listing_1",
            title: "Camera",
            images: [{ id: "img_1", url: "/img.jpg", isCover: true }],
            category: { id: "cat_1", name: "Electronics", slug: "electronics" },
            owner: { id: "owner_1", idVerified: true },
          },
        },
      ];
      mockFavoriteFindMany.mockResolvedValue(mockData);

      const result = await getFavoriteListings("user_1");
      expect(result).toHaveLength(1);
      expect(result[0].listing.title).toBe("Camera");

      expect(mockFavoriteFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user_1" },
          orderBy: { createdAt: "desc" },
        })
      );
    });

    it("returns empty array when user has no favorites", async () => {
      mockFavoriteFindMany.mockResolvedValue([]);

      const result = await getFavoriteListings("user_1");
      expect(result).toHaveLength(0);
    });
  });
});
