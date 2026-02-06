import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    listing: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock search module
const mockUpsertFtsEntry = vi.fn();
const mockDeleteFtsEntry = vi.fn();
vi.mock("@/lib/search", () => ({
  upsertFtsEntry: (...args: unknown[]) => mockUpsertFtsEntry(...args),
  deleteFtsEntry: (...args: unknown[]) => mockDeleteFtsEntry(...args),
  ensureFtsTable: vi.fn(),
}));

// Start with AI disabled (no API key)
const mockOpenAI = {
  moderations: {
    create: vi.fn(),
  },
  chat: {
    completions: {
      create: vi.fn(),
    },
  },
};

let aiEnabled = false;

vi.mock("@/lib/openai", () => ({
  get openai() {
    return aiEnabled ? mockOpenAI : null;
  },
  isAIEnabled: () => aiEnabled,
}));

import { moderateListing, suggestCategoryAndTags, translateListingText, translateAndIndexListing } from "../ai";
import { prisma } from "@/lib/db";

describe("listing AI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiEnabled = false;
  });

  describe("moderate", () => {
    it("skips moderation when AI is not enabled", async () => {
      aiEnabled = false;
      await moderateListing("listing_123");
      expect(prisma.listing.findUnique).not.toHaveBeenCalled();
    });

    it("calls omni-moderation-latest with text and image input", async () => {
      aiEnabled = true;
      vi.mocked(prisma.listing.findUnique).mockResolvedValue({
        id: "listing_123",
        title: "Power Drill",
        description: "Great drill for projects",
        images: [],
      } as ReturnType<typeof prisma.listing.findUnique> extends Promise<infer T> ? T : never);

      mockOpenAI.moderations.create.mockResolvedValue({
        results: [{ flagged: false, categories: { violence: false } }],
      });

      vi.mocked(prisma.listing.update).mockResolvedValue({} as ReturnType<typeof prisma.listing.update> extends Promise<infer T> ? T : never);

      await moderateListing("listing_123");

      expect(mockOpenAI.moderations.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "omni-moderation-latest",
        })
      );
    });

    it("sets aiVerified=true when content passes moderation", async () => {
      aiEnabled = true;
      vi.mocked(prisma.listing.findUnique).mockResolvedValue({
        id: "listing_123",
        title: "Power Drill",
        description: "Great drill for projects",
        images: [],
      } as ReturnType<typeof prisma.listing.findUnique> extends Promise<infer T> ? T : never);

      mockOpenAI.moderations.create.mockResolvedValue({
        results: [{ flagged: false, categories: { violence: false } }],
      });

      vi.mocked(prisma.listing.update).mockResolvedValue({} as ReturnType<typeof prisma.listing.update> extends Promise<infer T> ? T : never);

      await moderateListing("listing_123");

      expect(prisma.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            aiVerified: true,
            status: "active",
          }),
        })
      );
    });

    it("sets status=under_review when content is flagged", async () => {
      aiEnabled = true;
      vi.mocked(prisma.listing.findUnique).mockResolvedValue({
        id: "listing_123",
        title: "Bad Content",
        description: "Flagged content here",
        images: [],
      } as ReturnType<typeof prisma.listing.findUnique> extends Promise<infer T> ? T : never);

      mockOpenAI.moderations.create.mockResolvedValue({
        results: [
          { flagged: true, categories: { violence: true, harassment: false } },
        ],
      });

      vi.mocked(prisma.listing.update).mockResolvedValue({} as ReturnType<typeof prisma.listing.update> extends Promise<infer T> ? T : never);

      await moderateListing("listing_123");

      expect(prisma.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "under_review",
            aiVerified: false,
          }),
        })
      );
    });

    it("stores moderation categories as JSON in moderationResult", async () => {
      aiEnabled = true;
      const categories = { violence: false, harassment: false, sexual: false };

      vi.mocked(prisma.listing.findUnique).mockResolvedValue({
        id: "listing_123",
        title: "Power Drill",
        description: "Great drill for projects",
        images: [],
      } as ReturnType<typeof prisma.listing.findUnique> extends Promise<infer T> ? T : never);

      mockOpenAI.moderations.create.mockResolvedValue({
        results: [{ flagged: false, categories }],
      });

      vi.mocked(prisma.listing.update).mockResolvedValue({} as ReturnType<typeof prisma.listing.update> extends Promise<infer T> ? T : never);

      await moderateListing("listing_123");

      expect(prisma.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            moderationResult: JSON.stringify(categories),
          }),
        })
      );
    });
  });

  describe("suggest", () => {
    it("returns null when AI is not enabled", async () => {
      aiEnabled = false;
      const result = await suggestCategoryAndTags("base64data");
      expect(result).toBeNull();
    });

    it("calls gpt-4o-mini with image and returns category and tags", async () => {
      aiEnabled = true;
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: "tools",
                tags: ["drill", "power tool", "workshop"],
              }),
            },
          },
        ],
      });

      const result = await suggestCategoryAndTags("data:image/jpeg;base64,abc123");

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-4o-mini",
        })
      );
      expect(result).toEqual({
        category: "tools",
        tags: ["drill", "power tool", "workshop"],
      });
    });

    it("returns category slug from allowed list", async () => {
      aiEnabled = true;
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: "electronics",
                tags: ["camera"],
              }),
            },
          },
        ],
      });

      const result = await suggestCategoryAndTags("data:image/jpeg;base64,abc");
      expect(result?.category).toBe("electronics");
    });

    it("returns up to 5 tags", async () => {
      aiEnabled = true;
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: "tools",
                tags: ["a", "b", "c", "d", "e", "f", "g"],
              }),
            },
          },
        ],
      });

      const result = await suggestCategoryAndTags("data:image/jpeg;base64,abc");
      expect(result?.tags).toHaveLength(5);
    });

    it("returns null on API error", async () => {
      aiEnabled = true;
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error("API Error")
      );

      const result = await suggestCategoryAndTags("data:image/jpeg;base64,abc");
      expect(result).toBeNull();
    });
  });

  describe("translate", () => {
    it("returns null when AI is not enabled", async () => {
      aiEnabled = false;
      const result = await translateListingText("Power Drill", "A great drill");
      expect(result).toBeNull();
    });

    it("calls gpt-4o-mini with translation prompt and returns parsed JSON", async () => {
      aiEnabled = true;
      const translations = {
        en: { title: "Power Drill", description: "A great drill" },
        ru: { title: "Дрель", description: "Отличная дрель" },
        uz: { title: "Matkap", description: "Ajoyib matkap" },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(translations),
            },
          },
        ],
      });

      const result = await translateListingText("Power Drill", "A great drill");

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          max_tokens: 1000,
        })
      );
      expect(result).toEqual(translations);
    });

    it("returns null on API error", async () => {
      aiEnabled = true;
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error("Translation API Error")
      );

      const result = await translateListingText("Power Drill", "A great drill");
      expect(result).toBeNull();
    });
  });

  describe("translateAndIndex", () => {
    it("indexes with translations when AI available", async () => {
      aiEnabled = true;

      vi.mocked(prisma.listing.findUnique).mockResolvedValue({
        id: "listing_456",
        title: "Power Drill",
        description: "A great drill",
        tags: "drill,tool",
      } as ReturnType<typeof prisma.listing.findUnique> extends Promise<infer T> ? T : never);

      const translations = {
        en: { title: "Power Drill", description: "A great drill" },
        ru: { title: "Дрель", description: "Отличная дрель" },
        uz: { title: "Matkap", description: "Ajoyib matkap" },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(translations),
            },
          },
        ],
      });

      await translateAndIndexListing("listing_456");

      expect(mockUpsertFtsEntry).toHaveBeenCalledWith("listing_456", {
        titleEn: "Power Drill",
        titleRu: "Дрель",
        titleUz: "Matkap",
        descEn: "A great drill",
        descRu: "Отличная дрель",
        descUz: "Ajoyib matkap",
        tags: "drill,tool",
      });
    });

    it("indexes with original text when AI disabled", async () => {
      aiEnabled = false;

      vi.mocked(prisma.listing.findUnique).mockResolvedValue({
        id: "listing_789",
        title: "Power Drill",
        description: "A great drill",
        tags: "drill",
      } as ReturnType<typeof prisma.listing.findUnique> extends Promise<infer T> ? T : never);

      await translateAndIndexListing("listing_789");

      expect(mockUpsertFtsEntry).toHaveBeenCalledWith("listing_789", {
        titleEn: "Power Drill",
        titleRu: "Power Drill",
        titleUz: "Power Drill",
        descEn: "A great drill",
        descRu: "A great drill",
        descUz: "A great drill",
        tags: "drill",
      });
    });

    it("handles missing listing gracefully", async () => {
      aiEnabled = true;

      vi.mocked(prisma.listing.findUnique).mockResolvedValue(null);

      await translateAndIndexListing("nonexistent");

      expect(mockUpsertFtsEntry).not.toHaveBeenCalled();
    });
  });
});
