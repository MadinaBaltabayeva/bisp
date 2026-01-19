import { describe, it } from "vitest";

describe("review actions", () => {
  describe("createReview", () => {
    it.todo(
      "createReview: renter can review owner after completed rental"
    ); // TRST-01
    it.todo(
      "createReview: owner can review renter after completed rental"
    ); // TRST-02
    it.todo(
      "createReview: rejects review on non-completed rental"
    ); // TRST-01
    it.todo("createReview: rejects duplicate review"); // TRST-01, TRST-02
    it.todo(
      "createReview: recalculates reviewee averageRating and reviewCount"
    ); // TRST-01, TRST-02
  });

  describe("queries", () => {
    it.todo(
      "getReviewsForUser: returns reviews received by user"
    ); // TRST-01
    it.todo(
      "getReviewsForListing: returns reviews for listing owner"
    ); // TRST-01
    it.todo(
      "hasReviewed: returns true if user already reviewed this rental"
    ); // TRST-02
  });
});
