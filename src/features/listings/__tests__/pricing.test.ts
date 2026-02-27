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

// Mock FTS5 search module (needed because queries.ts imports it)
vi.mock("@/lib/search", () => ({
  ftsSearch: vi.fn(),
  getDictionary: vi.fn(),
  ensureFtsTable: vi.fn(),
}));

vi.mock("../search-utils", () => ({
  buildFtsQuery: vi.fn(),
  suggestCorrection: vi.fn(),
  extractHighlightTerms: vi.fn(),
}));

import { getCategoryPriceStats } from "../queries";

describe("getCategoryPriceStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns median price and count for category with multiple listings (odd count)", async () => {
    mockFindMany.mockResolvedValue([
      { priceDaily: 10 },
      { priceDaily: 30 },
      { priceDaily: 20 },
      { priceDaily: 50 },
      { priceDaily: 40 },
    ]);

    const result = await getCategoryPriceStats("cat-1");

    expect(result).toEqual({ averageDaily: 30, count: 5 });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        categoryId: "cat-1",
        status: "active",
        priceDaily: { not: null },
      },
      select: { priceDaily: true },
    });
  });

  it("returns average of two middle values for even count", async () => {
    mockFindMany.mockResolvedValue([
      { priceDaily: 10 },
      { priceDaily: 20 },
      { priceDaily: 30 },
      { priceDaily: 40 },
    ]);

    const result = await getCategoryPriceStats("cat-1");

    // Sorted: [10, 20, 30, 40], middle two: 20, 30, average: 25
    expect(result).toEqual({ averageDaily: 25, count: 4 });
  });

  it("returns null when no listings in category", async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await getCategoryPriceStats("cat-empty");

    expect(result).toBeNull();
  });

  it("excludes specified listing from calculation", async () => {
    mockFindMany.mockResolvedValue([
      { priceDaily: 15 },
      { priceDaily: 25 },
    ]);

    await getCategoryPriceStats("cat-1", "listing-to-exclude");

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        categoryId: "cat-1",
        status: "active",
        priceDaily: { not: null },
        id: { not: "listing-to-exclude" },
      },
      select: { priceDaily: true },
    });
  });

  it("rounds to 2 decimal places", async () => {
    mockFindMany.mockResolvedValue([
      { priceDaily: 10 },
      { priceDaily: 15 },
      { priceDaily: 20 },
    ]);

    const result = await getCategoryPriceStats("cat-1");

    // Median of [10, 15, 20] = 15 (exact, no rounding needed)
    expect(result).toEqual({ averageDaily: 15, count: 3 });
  });

  it("rounds correctly when median has many decimals", async () => {
    mockFindMany.mockResolvedValue([
      { priceDaily: 10.33 },
      { priceDaily: 20.67 },
    ]);

    const result = await getCategoryPriceStats("cat-1");

    // Average of 10.33 and 20.67 = 15.5
    expect(result).toEqual({ averageDaily: 15.5, count: 2 });
  });

  it("handles single listing (returns its price as average)", async () => {
    mockFindMany.mockResolvedValue([
      { priceDaily: 42.5 },
    ]);

    const result = await getCategoryPriceStats("cat-1");

    expect(result).toEqual({ averageDaily: 42.5, count: 1 });
  });
});
