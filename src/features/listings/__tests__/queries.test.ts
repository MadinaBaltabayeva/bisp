import { describe, it, expect } from "vitest";

describe("listing queries", () => {
  describe("search", () => {
    it.todo("returns active listings matching keyword in title");
    it.todo("returns active listings matching keyword in description");
    it.todo("excludes non-active listings from results");
  });

  describe("filter", () => {
    it.todo("filters listings by category slug");
    it.todo("filters listings by minimum price");
    it.todo("filters listings by maximum price");
    it.todo("filters listings by price range (min and max)");
    it.todo("combines keyword search with category filter");
  });

  describe("location", () => {
    it.todo("filters listings by region");
    it.todo("filters listings by radius when lat/lng and radius provided");
  });

  describe("sort", () => {
    it.todo("sorts by date descending by default");
    it.todo("sorts by price ascending");
    it.todo("sorts by price descending");
  });
});
