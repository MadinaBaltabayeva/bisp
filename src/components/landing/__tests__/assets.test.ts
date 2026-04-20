import { describe, it, expect } from "vitest";
import { LANDING_HERO, LANDING_CATEGORY_IMAGES } from "../assets";
import { CATEGORIES } from "@/features/seed/categories";

describe("landing assets", () => {
  it("LANDING_HERO is an https URL", () => {
    expect(LANDING_HERO).toMatch(/^https:\/\//);
  });

  it("every category slug in CATEGORIES has an image entry", () => {
    for (const { slug } of CATEGORIES) {
      expect(LANDING_CATEGORY_IMAGES[slug]).toMatch(/^https:\/\//);
    }
  });

  it("every category URL is from images.unsplash.com (or /landing/ local)", () => {
    for (const url of Object.values(LANDING_CATEGORY_IMAGES)) {
      expect(url.startsWith("https://images.unsplash.com") || url.startsWith("/landing/")).toBe(true);
    }
  });
});
