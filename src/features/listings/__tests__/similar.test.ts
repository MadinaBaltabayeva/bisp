import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
const mockFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    listing: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

import { getSimilarListings } from "../queries";

const makeListing = (id: string, categoryId = "cat_1") => ({
  id,
  title: `Listing ${id}`,
  status: "active",
  categoryId,
  priceDaily: 10,
  images: [],
  category: { id: categoryId, name: "Tools", slug: "tools" },
  owner: { id: "owner_1", name: "Owner", image: null, idVerified: false },
});

describe("getSimilarListings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns same-category listings excluding current listing", async () => {
    const listings = [makeListing("2"), makeListing("3")];
    mockFindMany.mockResolvedValue(listings);

    const result = await getSimilarListings("1", "cat_1");

    expect(result).toHaveLength(2);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categoryId: "cat_1",
          id: { not: "1" },
          status: "active",
        }),
        orderBy: { createdAt: "desc" },
        take: 4,
      })
    );
  });

  it("falls back to any-category when no same-category matches", async () => {
    const fallbackListings = [makeListing("2", "cat_2"), makeListing("3", "cat_3")];
    // First call (same category) returns empty, second call (any category) returns results
    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(fallbackListings);

    const result = await getSimilarListings("1", "cat_1");

    expect(result).toHaveLength(2);
    expect(mockFindMany).toHaveBeenCalledTimes(2);

    // Second call should NOT have categoryId filter
    const secondCall = mockFindMany.mock.calls[1][0];
    expect(secondCall.where).not.toHaveProperty("categoryId");
    expect(secondCall.where).toEqual(
      expect.objectContaining({
        id: { not: "1" },
        status: "active",
      })
    );
  });

  it("returns empty array when no listings exist at all", async () => {
    mockFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await getSimilarListings("1", "cat_1");

    expect(result).toEqual([]);
    expect(mockFindMany).toHaveBeenCalledTimes(2);
  });

  it("respects the limit parameter", async () => {
    const listings = [makeListing("2")];
    mockFindMany.mockResolvedValue(listings);

    await getSimilarListings("1", "cat_1", 2);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 2,
      })
    );
  });
});
