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

// Mock search module
vi.mock("@/lib/search", () => ({
  deleteFtsEntry: vi.fn().mockResolvedValue(undefined),
  upsertFtsEntry: vi.fn().mockResolvedValue(undefined),
  ensureFtsTable: vi.fn().mockResolvedValue(undefined),
}));

// Mock AI
const mockTranslateForLocale = vi.fn();
vi.mock("../ai", () => ({
  moderateListing: vi.fn().mockResolvedValue(undefined),
  suggestCategoryAndTags: vi.fn().mockResolvedValue(null),
  translateAndIndexListing: vi.fn().mockResolvedValue(undefined),
  translateForLocale: (...args: unknown[]) => mockTranslateForLocale(...args),
}));

// Mock file system
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs/promises")>();
  return {
    ...actual,
    default: {
      ...actual,
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
    },
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs/promises")>();
  return {
    ...actual,
    default: {
      ...actual,
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
    },
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock Prisma
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFindUnique = vi.fn();
const mockDeleteMany = vi.fn();
const mockFindFirst = vi.fn();

const mockTranslationFindUnique = vi.fn();
const mockTranslationUpsert = vi.fn();
const mockTranslationDeleteMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    listing: {
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    listingImage: {
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    listingTranslation: {
      findUnique: (...args: unknown[]) => mockTranslationFindUnique(...args),
      upsert: (...args: unknown[]) => mockTranslationUpsert(...args),
      deleteMany: (...args: unknown[]) => mockTranslationDeleteMany(...args),
    },
  },
}));

import { createListing, updateListing, deleteListing, translateListing } from "../actions";

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value);
  }
  return fd;
}

const validFields = {
  title: "Power Drill",
  description: "A high-quality power drill for weekend projects.",
  categoryId: "cat_123",
  condition: "good",
  priceDaily: "15",
  location: "San Francisco",
};

describe("listing actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("creates a listing with valid data and returns listingId", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user_1", name: "Alice" },
      });
      mockCreate.mockResolvedValue({ id: "listing_new" });

      const fd = makeFormData(validFields);
      const result = await createListing(fd);

      expect(result).toEqual({ success: true, listingId: "listing_new" });
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Power Drill",
            ownerId: "user_1",
          }),
        })
      );
    });

    it("requires authentication to create a listing", async () => {
      mockGetSession.mockResolvedValue(null);

      const fd = makeFormData(validFields);
      const result = await createListing(fd);

      expect(result).toEqual({
        error: "You must be logged in to create a listing.",
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("validates required fields via Zod schema", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user_1", name: "Alice" },
      });

      const fd = makeFormData({
        ...validFields,
        title: "AB", // too short
      });
      const result = await createListing(fd);

      expect(result.error).toBeDefined();
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("requires at least one pricing rate", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user_1", name: "Alice" },
      });

      const fd = makeFormData({
        title: "Power Drill",
        description: "A high-quality power drill for weekend projects.",
        categoryId: "cat_123",
        condition: "good",
        location: "San Francisco",
      });
      const result = await createListing(fd);

      expect(result.error).toBeDefined();
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("edit", () => {
    it("updates listing fields for the owner", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user_1", name: "Alice" },
      });
      mockFindUnique.mockResolvedValue({
        ownerId: "user_1",
        title: "Old Title",
        description: "Old description",
      });
      mockUpdate.mockResolvedValue({ id: "listing_1" });
      mockFindFirst.mockResolvedValue(null);

      const fd = makeFormData(validFields);
      const result = await updateListing("listing_1", fd);

      expect(result).toEqual({ success: true });
    });

    it("rejects updates from non-owners", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user_2", name: "Bob" },
      });
      mockFindUnique.mockResolvedValue({
        ownerId: "user_1",
        title: "Title",
        description: "Desc",
      });

      const fd = makeFormData(validFields);
      const result = await updateListing("listing_1", fd);

      expect(result).toEqual({
        error: "You can only edit your own listings.",
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("edit - cache invalidation", () => {
    it("deletes cached translations when title/description changes", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user_1", name: "Alice" },
      });
      mockFindUnique.mockResolvedValue({
        ownerId: "user_1",
        title: "Old Title",
        description: "Old description",
      });
      mockUpdate.mockResolvedValue({ id: "listing_1" });
      mockFindFirst.mockResolvedValue(null);

      const fd = makeFormData({
        ...validFields,
        title: "New Title", // Changed from "Old Title"
      });
      const result = await updateListing("listing_1", fd);

      expect(result).toEqual({ success: true });
      expect(mockTranslationDeleteMany).toHaveBeenCalledWith({
        where: { listingId: "listing_1" },
      });
    });
  });

  describe("translateListing", () => {
    it("returns cached translation without calling AI when cache exists", async () => {
      mockTranslationFindUnique.mockResolvedValue({
        translatedTitle: "Дрель",
        translatedDescription: "Отличная дрель",
        detectedLanguage: "en",
      });

      const result = await translateListing("listing_1", "ru");

      expect(result).toEqual({
        translatedTitle: "Дрель",
        translatedDescription: "Отличная дрель",
        detectedLanguage: "en",
      });
      expect(mockTranslateForLocale).not.toHaveBeenCalled();
    });

    it("calls AI and caches result on cache miss", async () => {
      mockTranslationFindUnique.mockResolvedValue(null);
      mockFindUnique.mockResolvedValue({
        title: "Power Drill",
        description: "A great drill",
      });
      mockTranslateForLocale.mockResolvedValue({
        detectedLanguage: "en",
        translatedTitle: "Дрель",
        translatedDescription: "Отличная дрель",
      });
      mockTranslationUpsert.mockResolvedValue({});

      const result = await translateListing("listing_1", "ru");

      expect(mockTranslateForLocale).toHaveBeenCalledWith(
        "Power Drill",
        "A great drill",
        "ru"
      );
      expect(mockTranslationUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { listingId_locale: { listingId: "listing_1", locale: "ru" } },
          create: expect.objectContaining({
            listingId: "listing_1",
            locale: "ru",
            translatedTitle: "Дрель",
            translatedDescription: "Отличная дрель",
            detectedLanguage: "en",
          }),
        })
      );
      expect(result).toEqual({
        detectedLanguage: "en",
        translatedTitle: "Дрель",
        translatedDescription: "Отличная дрель",
      });
    });

    it("returns error when listing not found", async () => {
      mockTranslationFindUnique.mockResolvedValue(null);
      mockFindUnique.mockResolvedValue(null);

      const result = await translateListing("nonexistent", "ru");

      expect(result).toEqual({ error: "Listing not found." });
    });

    it("returns error when AI translation fails", async () => {
      mockTranslationFindUnique.mockResolvedValue(null);
      mockFindUnique.mockResolvedValue({
        title: "Power Drill",
        description: "A great drill",
      });
      mockTranslateForLocale.mockResolvedValue(null);

      const result = await translateListing("listing_1", "ru");

      expect(result).toEqual({ error: "Translation unavailable." });
    });

    it("uses upsert to handle race conditions", async () => {
      mockTranslationFindUnique.mockResolvedValue(null);
      mockFindUnique.mockResolvedValue({
        title: "Power Drill",
        description: "A great drill",
      });
      mockTranslateForLocale.mockResolvedValue({
        detectedLanguage: "en",
        translatedTitle: "Дрель",
        translatedDescription: "Отличная дрель",
      });
      mockTranslationUpsert.mockResolvedValue({});

      await translateListing("listing_1", "ru");

      // Verify upsert is used (not create) for idempotent cache writes
      expect(mockTranslationUpsert).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("deletes listing for the owner", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user_1", name: "Alice" },
      });
      mockFindUnique.mockResolvedValue({ ownerId: "user_1" });
      mockDelete.mockResolvedValue({ id: "listing_1" });

      const result = await deleteListing("listing_1");

      expect(result).toEqual({ success: true });
      expect(mockDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "listing_1" },
        })
      );
    });

    it("rejects deletion from non-owners", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user_2", name: "Bob" },
      });
      mockFindUnique.mockResolvedValue({ ownerId: "user_1" });

      const result = await deleteListing("listing_1");

      expect(result).toEqual({
        error: "You can only delete your own listings.",
      });
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
