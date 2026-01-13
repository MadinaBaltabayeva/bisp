import { describe, it, expect } from "vitest";
import { listingSchema, searchSchema } from "../listing";

const validListing = {
  title: "Power Drill",
  description: "A high-quality power drill, perfect for weekend projects.",
  categoryId: "cat_123",
  condition: "good" as const,
  priceDaily: 15,
  location: "San Francisco",
};

describe("listing validations", () => {
  describe("listingSchema", () => {
    it("accepts valid listing data with all fields", () => {
      const result = listingSchema.safeParse({
        ...validListing,
        priceHourly: 5,
        priceWeekly: 80,
        priceMonthly: 250,
        region: "Bay Area",
        latitude: 37.7749,
        longitude: -122.4194,
      });
      expect(result.success).toBe(true);
    });

    it("rejects title shorter than 3 characters", () => {
      const result = listingSchema.safeParse({
        ...validListing,
        title: "AB",
      });
      expect(result.success).toBe(false);
    });

    it("rejects title longer than 100 characters", () => {
      const result = listingSchema.safeParse({
        ...validListing,
        title: "A".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("rejects description shorter than 10 characters", () => {
      const result = listingSchema.safeParse({
        ...validListing,
        description: "Short",
      });
      expect(result.success).toBe(false);
    });

    it("requires at least one pricing rate", () => {
      const result = listingSchema.safeParse({
        title: "Power Drill",
        description: "A high-quality power drill for projects.",
        categoryId: "cat_123",
        condition: "good",
        location: "San Francisco",
      });
      expect(result.success).toBe(false);
    });

    it("accepts any combination of pricing rates", () => {
      const hourlyOnly = listingSchema.safeParse({
        ...validListing,
        priceDaily: undefined,
        priceHourly: 5,
      });
      expect(hourlyOnly.success).toBe(true);

      const weeklyOnly = listingSchema.safeParse({
        ...validListing,
        priceDaily: undefined,
        priceWeekly: 80,
      });
      expect(weeklyOnly.success).toBe(true);

      const monthlyOnly = listingSchema.safeParse({
        ...validListing,
        priceDaily: undefined,
        priceMonthly: 250,
      });
      expect(monthlyOnly.success).toBe(true);
    });

    it("requires categoryId", () => {
      const result = listingSchema.safeParse({
        ...validListing,
        categoryId: "",
      });
      expect(result.success).toBe(false);
    });

    it("requires location", () => {
      const result = listingSchema.safeParse({
        ...validListing,
        location: "",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid condition values", () => {
      for (const condition of ["new", "like_new", "good", "fair", "poor"]) {
        const result = listingSchema.safeParse({
          ...validListing,
          condition,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid condition values", () => {
      const result = listingSchema.safeParse({
        ...validListing,
        condition: "broken",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("searchSchema", () => {
    it("accepts empty search params with defaults", () => {
      const result = searchSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("date");
      }
    });

    it("defaults sort to date", () => {
      const result = searchSchema.safeParse({ q: "drill" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("date");
      }
    });

    it("accepts all valid sort values", () => {
      for (const sort of ["relevance", "price_asc", "price_desc", "date"]) {
        const result = searchSchema.safeParse({ sort });
        expect(result.success).toBe(true);
      }
    });

    it("coerces minPrice and maxPrice to numbers", () => {
      const result = searchSchema.safeParse({
        minPrice: "10",
        maxPrice: "100",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minPrice).toBe(10);
        expect(result.data.maxPrice).toBe(100);
      }
    });

    it("accepts radius as optional number", () => {
      const result = searchSchema.safeParse({ radius: 25 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.radius).toBe(25);
      }
    });

    it("accepts latitude and longitude as optional numbers", () => {
      const result = searchSchema.safeParse({
        latitude: 37.7749,
        longitude: -122.4194,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.latitude).toBe(37.7749);
        expect(result.data.longitude).toBe(-122.4194);
      }
    });
  });
});
