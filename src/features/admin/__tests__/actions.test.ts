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

// Mock Prisma
const mockUserUpdate = vi.fn();
const mockUserDelete = vi.fn();
const mockListingUpdate = vi.fn();
const mockListingFindUnique = vi.fn();
const mockListingCount = vi.fn();
const mockRentalCount = vi.fn();
const mockMessageCount = vi.fn();
const mockReviewCount = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      update: (...args: unknown[]) => mockUserUpdate(...args),
      delete: (...args: unknown[]) => mockUserDelete(...args),
    },
    listing: {
      update: (...args: unknown[]) => mockListingUpdate(...args),
      findUnique: (...args: unknown[]) => mockListingFindUnique(...args),
      count: (...args: unknown[]) => mockListingCount(...args),
    },
    rental: {
      count: (...args: unknown[]) => mockRentalCount(...args),
    },
    message: {
      count: (...args: unknown[]) => mockMessageCount(...args),
    },
    review: {
      count: (...args: unknown[]) => mockReviewCount(...args),
    },
  },
}));

import {
  suspendUser,
  unsuspendUser,
  deleteUser,
  getUserDeletionCounts,
  approveListing,
  rejectListing,
} from "../actions";

describe("Admin Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("suspendUser sets isSuspended=true", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "admin_1", role: "admin" },
    });
    mockUserUpdate.mockResolvedValue({});

    const result = await suspendUser("user_1");
    expect(result).toEqual({ success: true });
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user_1" },
        data: { isSuspended: true },
      })
    );
  });

  it("unsuspendUser clears isSuspended", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "admin_1", role: "admin" },
    });
    mockUserUpdate.mockResolvedValue({});

    const result = await unsuspendUser("user_1");
    expect(result).toEqual({ success: true });
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user_1" },
        data: { isSuspended: false },
      })
    );
  });

  it("suspendUser rejects non-admin", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user_1", role: "user" },
    });

    const result = await suspendUser("user_2");
    expect(result).toEqual({ error: "Unauthorized" });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("suspendUser cannot suspend self", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "admin_1", role: "admin" },
    });

    const result = await suspendUser("admin_1");
    expect(result).toEqual({ error: "Cannot suspend yourself" });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("deleteUser cascades related records", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "admin_1", role: "admin" },
    });
    mockUserDelete.mockResolvedValue({});

    const result = await deleteUser("user_1");
    expect(result).toEqual({ success: true });
    expect(mockUserDelete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user_1" } })
    );
  });

  it("deleteUser rejects non-admin", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user_1", role: "user" },
    });

    const result = await deleteUser("user_2");
    expect(result).toEqual({ error: "Unauthorized" });
    expect(mockUserDelete).not.toHaveBeenCalled();
  });

  it("getUserDeletionCounts returns correct counts", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "admin_1", role: "admin" },
    });
    mockListingCount.mockResolvedValue(3);
    mockRentalCount.mockResolvedValue(5);
    mockMessageCount.mockResolvedValue(20);
    mockReviewCount.mockResolvedValue(2);

    const result = await getUserDeletionCounts("user_1");
    expect(result).toEqual({
      listings: 3,
      rentals: 5,
      messages: 20,
      reviews: 2,
    });
  });

  it("approveListing sets status=active and aiVerified=true", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "admin_1", role: "admin" },
    });
    mockListingUpdate.mockResolvedValue({});

    const result = await approveListing("listing_1");
    expect(result).toEqual({ success: true });
    expect(mockListingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "listing_1" },
        data: { status: "active", aiVerified: true },
      })
    );
  });

  it("rejectListing requires reason and sets status=rejected", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "admin_1", role: "admin" },
    });
    mockListingFindUnique.mockResolvedValue({
      moderationResult: JSON.stringify({ violence: false }),
    });
    mockListingUpdate.mockResolvedValue({});

    const result = await rejectListing("listing_1", "Inappropriate content");
    expect(result).toEqual({ success: true });
    expect(mockListingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "listing_1" },
        data: expect.objectContaining({
          status: "rejected",
        }),
      })
    );

    // Verify moderationResult includes rejection info
    const updateCall = mockListingUpdate.mock.calls[0][0];
    const moderationResult = JSON.parse(updateCall.data.moderationResult);
    expect(moderationResult.rejected).toBe(true);
    expect(moderationResult.rejectionReason).toBe("Inappropriate content");
  });

  it("rejectListing rejects empty reason", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "admin_1", role: "admin" },
    });

    const result = await rejectListing("listing_1", "  ");
    expect(result).toEqual({ error: "Rejection reason is required" });
    expect(mockListingUpdate).not.toHaveBeenCalled();
  });
});
