import { describe, it, expect } from "vitest";
import { profileSchema, onboardingSchema } from "../user";

describe("user validations", () => {
  describe("profileSchema", () => {
    it("accepts valid profile data", () => {
      const result = profileSchema.safeParse({
        name: "Alice",
        bio: "Hello world",
        location: "Tashkent",
      });
      expect(result.success).toBe(true);
    });

    it("rejects name shorter than 2 characters", () => {
      const result = profileSchema.safeParse({ name: "A" });
      expect(result.success).toBe(false);
    });

    it("rejects name longer than 50 characters", () => {
      const result = profileSchema.safeParse({ name: "A".repeat(51) });
      expect(result.success).toBe(false);
    });

    it("defaults bio to empty string", () => {
      const result = profileSchema.safeParse({ name: "Alice" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bio).toBe("");
      }
    });

    it("rejects bio longer than 500 characters", () => {
      const result = profileSchema.safeParse({
        name: "Alice",
        bio: "A".repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("onboardingSchema", () => {
    it("accepts valid onboarding data", () => {
      const result = onboardingSchema.safeParse({
        name: "Alice",
        location: "Tashkent",
      });
      expect(result.success).toBe(true);
    });

    it("rejects name shorter than 2 characters", () => {
      const result = onboardingSchema.safeParse({
        name: "A",
        location: "Tashkent",
      });
      expect(result.success).toBe(false);
    });

    it("rejects location shorter than 2 characters", () => {
      const result = onboardingSchema.safeParse({
        name: "Alice",
        location: "T",
      });
      expect(result.success).toBe(false);
    });
  });
});
