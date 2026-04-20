import { describe, it, expect } from "vitest";
import { LANDING_HERO, LANDING_CATEGORY_IMAGES } from "../assets";

describe("landing assets", () => {
  it("LANDING_HERO is an https URL", () => {
    expect(LANDING_HERO).toMatch(/^https:\/\//);
  });

  it("LANDING_CATEGORY_IMAGES contains all 8 category slugs", () => {
    const expected = [
      "tools",
      "electronics",
      "sports",
      "outdoor",
      "vehicles",
      "clothing",
      "music",
      "home-garden",
    ];
    for (const slug of expected) {
      expect(LANDING_CATEGORY_IMAGES[slug]).toMatch(/^https:\/\//);
    }
  });

  it("every category URL is from images.unsplash.com (or /landing/ local)", () => {
    for (const url of Object.values(LANDING_CATEGORY_IMAGES)) {
      expect(url.startsWith("https://images.unsplash.com") || url.startsWith("/landing/")).toBe(true);
    }
  });
});
