import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
const mockGetSession = vi.fn();
vi.mock("@/features/auth/queries", () => ({
  getSession: () => mockGetSession(),
}));

// Mock Prisma
const mockUserCount = vi.fn();
const mockUserFindMany = vi.fn();
const mockUserFindUnique = vi.fn();
const mockListingCount = vi.fn();
const mockListingFindMany = vi.fn();
const mockRentalCount = vi.fn();
const mockRentalFindMany = vi.fn();
const mockReviewFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      count: (...args: unknown[]) => mockUserCount(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    listing: {
      count: (...args: unknown[]) => mockListingCount(...args),
      findMany: (...args: unknown[]) => mockListingFindMany(...args),
    },
    rental: {
      count: (...args: unknown[]) => mockRentalCount(...args),
      findMany: (...args: unknown[]) => mockRentalFindMany(...args),
    },
    review: {
      findMany: (...args: unknown[]) => mockReviewFindMany(...args),
    },
  },
}));

import {
  getAdminStats,
  getAdminUsers,
  getFlaggedListings,
  getActivityFeed,
  checkNotSuspended,
} from "../queries";

describe("Admin Queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAdminStats returns correct counts", async () => {
    mockUserCount.mockResolvedValue(100);
    mockListingCount.mockResolvedValueOnce(50).mockResolvedValueOnce(3);
    mockRentalCount.mockResolvedValue(200);

    const stats = await getAdminStats();
    expect(stats).toEqual({
      totalUsers: 100,
      totalListings: 50,
      totalRentals: 200,
      flaggedCount: 3,
    });
  });

  it("getAdminUsers paginates correctly", async () => {
    mockUserFindMany.mockResolvedValue([
      { id: "u1", name: "Alice" },
      { id: "u2", name: "Bob" },
    ]);
    mockUserCount.mockResolvedValue(50);

    const result = await getAdminUsers({ page: 2 });
    expect(result.page).toBe(2);
    expect(result.total).toBe(50);
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20, // (page 2 - 1) * 20
        take: 20,
      })
    );
  });

  it("getAdminUsers filters by search and status", async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    await getAdminUsers({ search: "alice", status: "suspended" });

    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: "alice" } },
            { email: { contains: "alice" } },
          ],
          isSuspended: true,
        }),
      })
    );
  });

  it("getFlaggedListings returns under_review listings", async () => {
    mockListingFindMany.mockResolvedValue([
      { id: "l1", status: "under_review", title: "Flagged Item" },
    ]);

    const result = await getFlaggedListings();
    expect(result).toHaveLength(1);
    expect(mockListingFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "under_review" },
      })
    );
  });

  it("getActivityFeed returns sorted recent events", async () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000);

    mockUserFindMany.mockResolvedValue([
      { id: "u1", name: "Alice", createdAt: now },
    ]);
    mockListingFindMany.mockResolvedValue([
      { id: "l1", title: "Drill", createdAt: earlier, status: "active" },
    ]);
    mockRentalFindMany.mockResolvedValue([]);
    mockReviewFindMany.mockResolvedValue([]);

    const feed = await getActivityFeed();
    expect(feed.length).toBeGreaterThanOrEqual(1);
    // Most recent first
    expect(feed[0].type).toBe("user_joined");
    expect(feed[0].description).toContain("Alice");
  });

  it("checkNotSuspended returns error for suspended users", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user_1" } });
    mockUserFindUnique.mockResolvedValue({ isSuspended: true });

    const result = await checkNotSuspended();
    expect(result).toEqual({ error: "Your account is suspended." });

    // Non-suspended user
    mockUserFindUnique.mockResolvedValue({ isSuspended: false });
    const result2 = await checkNotSuspended();
    expect(result2).toEqual({});
  });
});
