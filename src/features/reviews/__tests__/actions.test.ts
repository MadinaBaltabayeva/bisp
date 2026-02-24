import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Next.js server modules
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock auth
const mockGetSession = vi.fn();
vi.mock("@/features/auth/queries", () => ({
  getSession: () => mockGetSession(),
}));

// Mock admin queries (checkNotSuspended)
vi.mock("@/features/admin/queries", () => ({
  checkNotSuspended: vi.fn().mockResolvedValue({}),
}));

// Mock notifications
vi.mock("@/features/notifications/create-notification", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

// Mock Prisma
const mockRentalFindUnique = vi.fn();
const mockReviewCreate = vi.fn();
const mockReviewAggregate = vi.fn();
const mockUserUpdate = vi.fn();
const mockReviewFindMany = vi.fn();
const mockReviewFindUnique = vi.fn();

const mockTx = {
  review: {
    create: (...args: unknown[]) => mockReviewCreate(...args),
    aggregate: (...args: unknown[]) => mockReviewAggregate(...args),
  },
  user: {
    update: (...args: unknown[]) => mockUserUpdate(...args),
  },
};

vi.mock("@/lib/db", () => ({
  prisma: {
    rental: {
      findUnique: (...args: unknown[]) => mockRentalFindUnique(...args),
    },
    review: {
      findMany: (...args: unknown[]) => mockReviewFindMany(...args),
      findUnique: (...args: unknown[]) => mockReviewFindUnique(...args),
    },
    $transaction: (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
  },
}));

import { createReview } from "../actions";
import { getReviewsForUser, getReviewsForListing, hasReviewed } from "../queries";

const validReview = {
  rentalId: "rental_1",
  revieweeId: "user_2",
  rating: 5,
  comment: "Great experience!",
};

describe("review actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createReview", () => {
    it("renter can review owner after completed rental", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1", name: "User 1" } });
      mockRentalFindUnique.mockResolvedValue({
        id: "rental_1",
        status: "completed",
        renterId: "user_1",
        ownerId: "user_2",
        listing: { title: "Test Listing" },
      });
      mockReviewCreate.mockResolvedValue({ id: "review_1" });
      mockReviewAggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { rating: 3 },
      });
      mockUserUpdate.mockResolvedValue({});

      const result = await createReview(validReview);
      expect(result).toEqual({ success: true });
      expect(mockReviewCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rating: 5,
            reviewerId: "user_1",
            revieweeId: "user_2",
          }),
        })
      );
    });

    it("owner can review renter after completed rental", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_2", name: "User 2" } });
      mockRentalFindUnique.mockResolvedValue({
        id: "rental_1",
        status: "completed",
        renterId: "user_1",
        ownerId: "user_2",
        listing: { title: "Test Listing" },
      });
      mockReviewCreate.mockResolvedValue({ id: "review_2" });
      mockReviewAggregate.mockResolvedValue({
        _avg: { rating: 4.0 },
        _count: { rating: 2 },
      });
      mockUserUpdate.mockResolvedValue({});

      const result = await createReview({
        ...validReview,
        revieweeId: "user_1",
      });
      expect(result).toEqual({ success: true });
    });

    it("rejects review on non-completed rental", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1", name: "User 1" } });
      mockRentalFindUnique.mockResolvedValue({
        id: "rental_1",
        status: "active",
        renterId: "user_1",
        ownerId: "user_2",
        listing: { title: "Test Listing" },
      });

      const result = await createReview(validReview);
      expect(result).toEqual({
        error: "You can only review completed rentals.",
      });
      expect(mockReviewCreate).not.toHaveBeenCalled();
    });

    it("rejects duplicate review", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1", name: "User 1" } });
      mockRentalFindUnique.mockResolvedValue({
        id: "rental_1",
        status: "completed",
        renterId: "user_1",
        ownerId: "user_2",
        listing: { title: "Test Listing" },
      });
      mockReviewCreate.mockRejectedValue(
        new Error("UNIQUE constraint failed")
      );

      const result = await createReview(validReview);
      expect(result).toEqual({
        error: "You have already reviewed this rental.",
      });
    });

    it("recalculates reviewee averageRating and reviewCount", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1", name: "User 1" } });
      mockRentalFindUnique.mockResolvedValue({
        id: "rental_1",
        status: "completed",
        renterId: "user_1",
        ownerId: "user_2",
        listing: { title: "Test Listing" },
      });
      mockReviewCreate.mockResolvedValue({ id: "review_1" });
      mockReviewAggregate.mockResolvedValue({
        _avg: { rating: 4.3 },
        _count: { rating: 10 },
      });
      mockUserUpdate.mockResolvedValue({});

      await createReview(validReview);

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user_2" },
          data: {
            averageRating: 4.3,
            reviewCount: 10,
          },
        })
      );
    });
  });

  describe("queries", () => {
    it("getReviewsForUser returns reviews received by user", async () => {
      mockReviewFindMany.mockResolvedValue([
        { id: "r1", rating: 5, revieweeId: "user_1" },
      ]);

      const result = await getReviewsForUser("user_1");
      expect(result).toHaveLength(1);
      expect(mockReviewFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { revieweeId: "user_1" },
        })
      );
    });

    it("getReviewsForListing returns reviews for listing owner", async () => {
      mockReviewFindMany.mockResolvedValue([
        { id: "r1", rating: 4 },
      ]);

      const result = await getReviewsForListing("listing_1");
      expect(result).toHaveLength(1);
      expect(mockReviewFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { rental: { listingId: "listing_1" } },
        })
      );
    });

    it("hasReviewed returns true if user already reviewed this rental", async () => {
      mockReviewFindUnique.mockResolvedValue({ id: "review_1" });

      const result = await hasReviewed("rental_1", "user_1");
      expect(result).toBe(true);

      mockReviewFindUnique.mockResolvedValue(null);
      const result2 = await hasReviewed("rental_2", "user_1");
      expect(result2).toBe(false);
    });
  });
});
