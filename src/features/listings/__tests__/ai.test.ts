import { describe, it, expect, vi } from "vitest";

// Mock the OpenAI client module
vi.mock("@/lib/openai", () => ({
  openai: null,
  isAIEnabled: () => false,
}));

describe("listing AI", () => {
  describe("moderate", () => {
    it.todo("skips moderation when AI is not enabled");
    it.todo("calls omni-moderation-latest with text and image input");
    it.todo("sets aiVerified=true when content passes moderation");
    it.todo("sets status=under_review when content is flagged");
    it.todo("stores moderation categories as JSON in moderationResult");
  });

  describe("suggest", () => {
    it.todo("returns null when AI is not enabled");
    it.todo("calls gpt-4o-mini with image and returns category and tags");
    it.todo("returns category slug from allowed list");
    it.todo("returns up to 5 tags");
    it.todo("returns null on API error");
  });
});
