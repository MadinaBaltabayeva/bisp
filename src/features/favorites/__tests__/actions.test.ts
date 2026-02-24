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

// Mock notifications
vi.mock("@/features/notifications/create-notification", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

// Mock Prisma
const mockFavoriteFindUnique = vi.fn();
const mockFavoriteCreate = vi.fn();
const mockFavoriteDelete = vi.fn();
const mockListingFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    favorite: {
      findUnique: (...args: unknown[]) => mockFavoriteFindUnique(...args),
      create: (...args: unknown[]) => mockFavoriteCreate(...args),
      delete: (...args: unknown[]) => mockFavoriteDelete(...args),
    },
    listing: {
      findUnique: (...args: unknown[]) => mockListingFindUnique(...args),
    },
  },
}));

import { toggleFavorite } from "../actions";

describe("favorites actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toggleFavorite", () => {
    it("creates a favorite when none exists", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1", name: "Test User" } });
      mockFavoriteFindUnique.mockResolvedValue(null);
      mockFavoriteCreate.mockResolvedValue({
        id: "fav_1",
        userId: "user_1",
        listingId: "listing_1",
      });
      mockListingFindUnique.mockResolvedValue({
        ownerId: "user_2",
        title: "Test Listing",
      });

      const result = await toggleFavorite("listing_1");
      expect(result).toEqual({ success: true, isFavorited: true });
      expect(mockFavoriteCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { userId: "user_1", listingId: "listing_1" },
        })
      );
    });

    it("deletes a favorite when one exists", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1" } });
      mockFavoriteFindUnique.mockResolvedValue({
        id: "fav_1",
        userId: "user_1",
        listingId: "listing_1",
      });
      mockFavoriteDelete.mockResolvedValue({});

      const result = await toggleFavorite("listing_1");
      expect(result).toEqual({ success: true, isFavorited: false });
      expect(mockFavoriteDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_listingId: { userId: "user_1", listingId: "listing_1" } },
        })
      );
    });

    it("returns error when not logged in", async () => {
      mockGetSession.mockResolvedValue(null);

      const result = await toggleFavorite("listing_1");
      expect(result).toEqual({ error: "Must be logged in." });
      expect(mockFavoriteFindUnique).not.toHaveBeenCalled();
      expect(mockFavoriteCreate).not.toHaveBeenCalled();
    });
  });
});
