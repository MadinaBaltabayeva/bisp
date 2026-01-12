import { describe, it, expect } from "vitest";

describe("listing actions", () => {
  describe("create", () => {
    it.todo("creates a listing with valid data and returns listingId");
    it.todo("requires authentication to create a listing");
    it.todo("validates required fields via Zod schema");
    it.todo("requires at least one pricing rate");
  });

  describe("photos", () => {
    it.todo("saves uploaded photos to public/uploads/listings/");
    it.todo("sets first photo as cover image");
    it.todo("rejects files with invalid MIME types");
    it.todo("rejects files exceeding 5MB");
  });

  describe("edit", () => {
    it.todo("updates listing fields for the owner");
    it.todo("rejects updates from non-owners");
    it.todo("handles adding new photos to existing listing");
    it.todo("handles deleting existing photos");
  });

  describe("delete", () => {
    it.todo("deletes listing for the owner");
    it.todo("rejects deletion from non-owners");
    it.todo("cascade deletes associated images");
  });
});
