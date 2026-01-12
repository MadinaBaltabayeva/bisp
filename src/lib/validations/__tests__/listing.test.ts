import { describe, it, expect } from "vitest";

describe("listing validations", () => {
  describe("listingSchema", () => {
    it.todo("accepts valid listing data with all fields");
    it.todo("rejects title shorter than 3 characters");
    it.todo("rejects title longer than 100 characters");
    it.todo("rejects description shorter than 10 characters");
    it.todo("requires at least one pricing rate");
    it.todo("accepts any combination of pricing rates");
    it.todo("requires categoryId");
    it.todo("requires location");
    it.todo("accepts valid condition values");
    it.todo("rejects invalid condition values");
  });

  describe("searchSchema", () => {
    it.todo("accepts empty search params with defaults");
    it.todo("defaults sort to date");
    it.todo("accepts all valid sort values");
    it.todo("coerces minPrice and maxPrice to numbers");
    it.todo("accepts radius as optional number");
    it.todo("accepts latitude and longitude as optional numbers");
  });
});
