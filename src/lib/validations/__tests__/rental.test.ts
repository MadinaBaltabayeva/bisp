import { describe, it, expect } from "vitest";
import { rentalRequestSchema } from "../rental";

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfter = new Date();
dayAfter.setDate(dayAfter.getDate() + 2);

const validRental = {
  listingId: "listing_1",
  startDate: tomorrow,
  endDate: dayAfter,
};

describe("rental validations", () => {
  describe("rentalRequestSchema", () => {
    it("accepts valid rental request", () => {
      const result = rentalRequestSchema.safeParse(validRental);
      expect(result.success).toBe(true);
    });

    it("rejects start date in the past", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = rentalRequestSchema.safeParse({
        ...validRental,
        startDate: yesterday,
      });
      expect(result.success).toBe(false);
    });

    it("rejects end date before start date", () => {
      const result = rentalRequestSchema.safeParse({
        ...validRental,
        startDate: dayAfter,
        endDate: tomorrow,
      });
      expect(result.success).toBe(false);
    });

    it("requires listingId", () => {
      const result = rentalRequestSchema.safeParse({
        startDate: tomorrow,
        endDate: dayAfter,
      });
      expect(result.success).toBe(false);
    });

    it("accepts optional message up to 500 chars", () => {
      const result = rentalRequestSchema.safeParse({
        ...validRental,
        message: "I'd like to rent this item please",
      });
      expect(result.success).toBe(true);
    });

    it("coerces date strings to Date objects", () => {
      const result = rentalRequestSchema.safeParse({
        listingId: "listing_1",
        startDate: tomorrow.toISOString(),
        endDate: dayAfter.toISOString(),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBeInstanceOf(Date);
        expect(result.data.endDate).toBeInstanceOf(Date);
      }
    });
  });
});
