import { describe, it } from "vitest";

describe("rental actions", () => {
  describe("createRentalRequest", () => {
    it.todo(
      "createRentalRequest: creates rental with valid dates and listing"
    ); // RENT-01
    it.todo("createRentalRequest: rejects request on own listing"); // RENT-01
    it.todo("createRentalRequest: rejects invalid date range"); // RENT-01
    it.todo(
      "createRentalRequest: calculates total price from daily rate * days"
    ); // RENT-04
    it.todo(
      "createRentalRequest: calculates security deposit as 20% of total"
    ); // RENT-04
  });

  describe("approveRental", () => {
    it.todo("approveRental: owner can approve a requested rental"); // RENT-02
    it.todo("approveRental: non-owner cannot approve"); // RENT-02
  });

  describe("declineRental", () => {
    it.todo("declineRental: owner can decline a requested rental"); // RENT-02
  });

  describe("markReturned", () => {
    it.todo("markReturned: owner can mark active rental as returned"); // RENT-03
  });

  describe("completeRental", () => {
    it.todo("completeRental: returned rental transitions to completed"); // RENT-03
  });

  describe("activateApprovedRentals", () => {
    it.todo(
      "activateApprovedRentals: transitions approved rentals past start date to active"
    ); // RENT-03
  });

  describe("queries", () => {
    it.todo("getRentalsAsRenter: returns rentals where user is renter"); // RENT-03
    it.todo("getRentalsAsOwner: returns rentals where user is owner"); // RENT-03
  });
});
