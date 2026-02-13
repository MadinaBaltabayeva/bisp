import { describe, it, expect } from "vitest";
import { reviewSchema } from "../review";

const validReview = {
  rentalId: "rental_1",
  revieweeId: "user_2",
  rating: 4,
};

describe("review validations", () => {
  describe("reviewSchema", () => {
    it("accepts valid review", () => {
      const result = reviewSchema.safeParse(validReview);
      expect(result.success).toBe(true);
    });

    it("accepts rating values 1 through 5", () => {
      for (const rating of [1, 2, 3, 4, 5]) {
        const result = reviewSchema.safeParse({ ...validReview, rating });
        expect(result.success).toBe(true);
      }
    });

    it("rejects rating of 0", () => {
      const result = reviewSchema.safeParse({ ...validReview, rating: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects rating above 5", () => {
      const result = reviewSchema.safeParse({ ...validReview, rating: 6 });
      expect(result.success).toBe(false);
    });

    it("accepts optional comment up to 1000 chars", () => {
      const result = reviewSchema.safeParse({
        ...validReview,
        comment: "Great experience renting this item!",
      });
      expect(result.success).toBe(true);

      const tooLong = reviewSchema.safeParse({
        ...validReview,
        comment: "A".repeat(1001),
      });
      expect(tooLong.success).toBe(false);
    });

    it("requires rentalId and revieweeId", () => {
      expect(reviewSchema.safeParse({ rating: 4 }).success).toBe(false);
      expect(
        reviewSchema.safeParse({ rentalId: "r1", rating: 4 }).success
      ).toBe(false);
      expect(
        reviewSchema.safeParse({ revieweeId: "u1", rating: 4 }).success
      ).toBe(false);
    });
  });
});
