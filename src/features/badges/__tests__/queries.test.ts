import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
const mockRentalCount = vi.fn();
const mockUserFindUnique = vi.fn();
const mockRentalGroupBy = vi.fn();
const mockUserFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    rental: {
      count: (...args: unknown[]) => mockRentalCount(...args),
      groupBy: (...args: unknown[]) => mockRentalGroupBy(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
  },
}));

import { getUserBadges, getUsersBadges } from "../queries";

describe("badge queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserBadges", () => {
    it("returns trusted_owner badge when user has 3+ completed rentals as owner", async () => {
      mockRentalCount
        .mockResolvedValueOnce(3) // ownerCount
        .mockResolvedValueOnce(0); // renterCount
      mockUserFindUnique.mockResolvedValue({
        averageRating: 0,
        reviewCount: 0,
      });

      const badges = await getUserBadges("user_1");
      expect(badges).toContainEqual(
        expect.objectContaining({ type: "trusted_owner" })
      );
      expect(badges).not.toContainEqual(
        expect.objectContaining({ type: "new_member" })
      );
    });

    it("returns active_renter badge when user has 3+ completed rentals as renter", async () => {
      mockRentalCount
        .mockResolvedValueOnce(0) // ownerCount
        .mockResolvedValueOnce(5); // renterCount
      mockUserFindUnique.mockResolvedValue({
        averageRating: 0,
        reviewCount: 0,
      });

      const badges = await getUserBadges("user_1");
      expect(badges).toContainEqual(
        expect.objectContaining({ type: "active_renter" })
      );
      expect(badges).not.toContainEqual(
        expect.objectContaining({ type: "new_member" })
      );
    });

    it("returns top_rated badge when user has averageRating >= 4.5 and reviewCount >= 2", async () => {
      mockRentalCount
        .mockResolvedValueOnce(0) // ownerCount
        .mockResolvedValueOnce(0); // renterCount
      mockUserFindUnique.mockResolvedValue({
        averageRating: 4.8,
        reviewCount: 5,
      });

      const badges = await getUserBadges("user_1");
      expect(badges).toContainEqual(
        expect.objectContaining({ type: "top_rated" })
      );
      expect(badges).not.toContainEqual(
        expect.objectContaining({ type: "new_member" })
      );
    });

    it("returns new_member badge when user has no other badges", async () => {
      mockRentalCount
        .mockResolvedValueOnce(0) // ownerCount
        .mockResolvedValueOnce(0); // renterCount
      mockUserFindUnique.mockResolvedValue({
        averageRating: 3.0,
        reviewCount: 1,
      });

      const badges = await getUserBadges("user_1");
      expect(badges).toHaveLength(1);
      expect(badges[0].type).toBe("new_member");
      expect(badges[0].labelKey).toBe("newMember");
    });

    it("returns multiple badges when multiple thresholds met", async () => {
      mockRentalCount
        .mockResolvedValueOnce(5) // ownerCount
        .mockResolvedValueOnce(3); // renterCount
      mockUserFindUnique.mockResolvedValue({
        averageRating: 4.9,
        reviewCount: 10,
      });

      const badges = await getUserBadges("user_1");
      const types = badges.map((b) => b.type);
      expect(types).toContain("trusted_owner");
      expect(types).toContain("active_renter");
      expect(types).toContain("top_rated");
      expect(types).not.toContain("new_member");
    });

    it("does NOT return new_member when other badges are present", async () => {
      mockRentalCount
        .mockResolvedValueOnce(10) // ownerCount
        .mockResolvedValueOnce(0); // renterCount
      mockUserFindUnique.mockResolvedValue({
        averageRating: 0,
        reviewCount: 0,
      });

      const badges = await getUserBadges("user_1");
      expect(badges).toContainEqual(
        expect.objectContaining({ type: "trusted_owner" })
      );
      expect(badges).not.toContainEqual(
        expect.objectContaining({ type: "new_member" })
      );
    });
  });

  describe("getUsersBadges", () => {
    it("batch processes multiple user IDs correctly with only 3 DB queries", async () => {
      // groupBy for owner counts
      mockRentalGroupBy.mockResolvedValueOnce([
        { ownerId: "user_1", _count: { _all: 5 } },
        { ownerId: "user_2", _count: { _all: 1 } },
      ]);
      // groupBy for renter counts
      mockRentalGroupBy.mockResolvedValueOnce([
        { renterId: "user_1", _count: { _all: 0 } },
        { renterId: "user_2", _count: { _all: 4 } },
      ]);
      // findMany for user stats
      mockUserFindMany.mockResolvedValue([
        { id: "user_1", averageRating: 4.9, reviewCount: 3 },
        { id: "user_2", averageRating: 3.0, reviewCount: 1 },
      ]);

      const result = await getUsersBadges(["user_1", "user_2"]);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);

      // user_1: trusted_owner (5 completions as owner) + top_rated (4.9 with 3 reviews)
      const user1Badges = result.get("user_1")!;
      const user1Types = user1Badges.map((b) => b.type);
      expect(user1Types).toContain("trusted_owner");
      expect(user1Types).toContain("top_rated");
      expect(user1Types).not.toContain("new_member");

      // user_2: active_renter (4 completions as renter)
      const user2Badges = result.get("user_2")!;
      const user2Types = user2Badges.map((b) => b.type);
      expect(user2Types).toContain("active_renter");
      expect(user2Types).not.toContain("new_member");

      // Verify only 3 DB calls total (2 groupBy + 1 findMany)
      expect(mockRentalGroupBy).toHaveBeenCalledTimes(2);
      expect(mockUserFindMany).toHaveBeenCalledTimes(1);
    });
  });
});
