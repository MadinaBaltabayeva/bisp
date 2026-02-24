import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Next.js server modules
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock auth
const mockGetSession = vi.fn();
vi.mock("@/features/auth/queries", () => ({
  getSession: () => mockGetSession(),
}));

// Mock admin queries (checkNotSuspended)
vi.mock("@/features/admin/queries", () => ({
  checkNotSuspended: vi.fn().mockResolvedValue({}),
}));

// Mock notifications
vi.mock("@/features/notifications/create-notification", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

// Mock Prisma
const mockRentalCreate = vi.fn();
const mockRentalFindUnique = vi.fn();
const mockRentalUpdate = vi.fn();
const mockRentalUpdateMany = vi.fn();
const mockRentalFindMany = vi.fn();
const mockListingFindUnique = vi.fn();
const mockRentalEventCreate = vi.fn();
const mock$Transaction = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    rental: {
      create: (...args: unknown[]) => mockRentalCreate(...args),
      findUnique: (...args: unknown[]) => mockRentalFindUnique(...args),
      update: (...args: unknown[]) => mockRentalUpdate(...args),
      updateMany: (...args: unknown[]) => mockRentalUpdateMany(...args),
      findMany: (...args: unknown[]) => mockRentalFindMany(...args),
    },
    listing: {
      findUnique: (...args: unknown[]) => mockListingFindUnique(...args),
    },
    rentalEvent: {
      create: (...args: unknown[]) => mockRentalEventCreate(...args),
    },
    $transaction: (...args: unknown[]) => mock$Transaction(...args),
  },
}));

import {
  createRentalRequest,
  approveRental,
  declineRental,
  markReturned,
  completeRental,
} from "../actions";
import { getRentalsAsRenter, getRentalsAsOwner, activateApprovedRentals, getRentalWithEvents } from "../queries";

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfter = new Date();
dayAfter.setDate(dayAfter.getDate() + 5);

const validRequest = {
  listingId: "listing_1",
  startDate: tomorrow,
  endDate: dayAfter,
  message: "I'd like to rent this",
};

describe("rental actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: $transaction executes the callback (interactive transaction pattern)
    mock$Transaction.mockImplementation(async (cbOrArray: unknown) => {
      if (typeof cbOrArray === "function") {
        // Interactive transaction: call the callback with the mock prisma object
        const { prisma } = await import("@/lib/db");
        return cbOrArray(prisma);
      }
      // Batch transaction: resolve all promises
      return Promise.all(cbOrArray as Promise<unknown>[]);
    });
  });

  describe("createRentalRequest", () => {
    it("creates rental with valid dates and listing using $transaction", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1", name: "User 1" } });
      mockListingFindUnique.mockResolvedValue({
        id: "listing_1",
        ownerId: "user_2",
        status: "active",
        priceDaily: 10,
        title: "Test Listing",
      });
      mockRentalCreate.mockResolvedValue({ id: "rental_1" });
      mockRentalEventCreate.mockResolvedValue({ id: "event_1" });

      const result = await createRentalRequest(validRequest);
      expect(result).toEqual({ success: true });
      expect(mock$Transaction).toHaveBeenCalled();
    });

    it("creates RentalEvent with status 'requested' during rental creation", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1", name: "User 1" } });
      mockListingFindUnique.mockResolvedValue({
        id: "listing_1",
        ownerId: "user_2",
        status: "active",
        priceDaily: 10,
        title: "Test Listing",
      });
      mockRentalCreate.mockResolvedValue({ id: "rental_1" });
      mockRentalEventCreate.mockResolvedValue({ id: "event_1" });

      await createRentalRequest(validRequest);
      expect(mockRentalEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rentalId: "rental_1",
            status: "requested",
            actorId: "user_1",
          }),
        })
      );
    });

    it("rejects request on own listing", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1", name: "User 1" } });
      mockListingFindUnique.mockResolvedValue({
        id: "listing_1",
        ownerId: "user_1",
        status: "active",
        priceDaily: 10,
        title: "Test Listing",
      });

      const result = await createRentalRequest(validRequest);
      expect(result).toEqual({ error: "You cannot rent your own listing." });
      expect(mockRentalCreate).not.toHaveBeenCalled();
    });

    it("rejects invalid date range", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1", name: "User 1" } });

      const result = await createRentalRequest({
        ...validRequest,
        startDate: dayAfter,
        endDate: tomorrow,
      });
      expect(result.error).toBeDefined();
      expect(mockRentalCreate).not.toHaveBeenCalled();
    });

    it("calculates total price from daily rate * days", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1", name: "User 1" } });
      mockListingFindUnique.mockResolvedValue({
        id: "listing_1",
        ownerId: "user_2",
        status: "active",
        priceDaily: 10,
        title: "Test Listing",
      });
      mockRentalCreate.mockResolvedValue({ id: "rental_1" });
      mockRentalEventCreate.mockResolvedValue({ id: "event_1" });

      await createRentalRequest(validRequest);

      const createCall = mockRentalCreate.mock.calls[0][0];
      const days = Math.ceil(
        (dayAfter.getTime() - tomorrow.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(createCall.data.totalPrice).toBe(days * 10);
    });

    it("calculates security deposit as 20% of total", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1", name: "User 1" } });
      mockListingFindUnique.mockResolvedValue({
        id: "listing_1",
        ownerId: "user_2",
        status: "active",
        priceDaily: 100,
      });
      mockRentalCreate.mockResolvedValue({ id: "rental_1" });
      mockRentalEventCreate.mockResolvedValue({ id: "event_1" });

      await createRentalRequest(validRequest);

      const createCall = mockRentalCreate.mock.calls[0][0];
      expect(createCall.data.securityDeposit).toBe(
        createCall.data.totalPrice * 0.2
      );
    });
  });

  describe("approveRental", () => {
    it("owner can approve a requested rental using $transaction", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_2", name: "User 2" } });
      mockRentalFindUnique.mockResolvedValue({
        ownerId: "user_2",
        renterId: "user_1",
        status: "requested",
        listing: { title: "Test Listing" },
      });
      mockRentalUpdate.mockResolvedValue({ id: "rental_1" });
      mockRentalEventCreate.mockResolvedValue({ id: "event_1" });

      const result = await approveRental("rental_1");
      expect(result).toEqual({ success: true });
      expect(mock$Transaction).toHaveBeenCalled();
    });

    it("creates RentalEvent with status 'approved' on approval", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_2", name: "User 2" } });
      mockRentalFindUnique.mockResolvedValue({
        ownerId: "user_2",
        renterId: "user_1",
        status: "requested",
        listing: { title: "Test Listing" },
      });
      mockRentalUpdate.mockResolvedValue({ id: "rental_1" });
      mockRentalEventCreate.mockResolvedValue({ id: "event_1" });

      await approveRental("rental_1");

      // Verify $transaction was called with an array containing the event create
      const txArg = mock$Transaction.mock.calls[0][0];
      expect(txArg).toBeInstanceOf(Array);
      expect(txArg).toHaveLength(2);
    });

    it("non-owner cannot approve", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1", name: "User 1" } });
      mockRentalFindUnique.mockResolvedValue({
        ownerId: "user_2",
        renterId: "user_1",
        status: "requested",
        listing: { title: "Test Listing" },
      });

      const result = await approveRental("rental_1");
      expect(result).toEqual({
        error: "Only the listing owner can approve rentals.",
      });
      expect(mock$Transaction).not.toHaveBeenCalled();
    });
  });

  describe("declineRental", () => {
    it("owner can decline a requested rental using $transaction", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_2", name: "User 2" } });
      mockRentalFindUnique.mockResolvedValue({
        ownerId: "user_2",
        renterId: "user_1",
        status: "requested",
        listing: { title: "Test Listing" },
      });
      mockRentalUpdate.mockResolvedValue({ id: "rental_1" });
      mockRentalEventCreate.mockResolvedValue({ id: "event_1" });

      const result = await declineRental("rental_1");
      expect(result).toEqual({ success: true });
      expect(mock$Transaction).toHaveBeenCalled();
    });

    it("creates RentalEvent with status 'declined' on decline", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_2", name: "User 2" } });
      mockRentalFindUnique.mockResolvedValue({
        ownerId: "user_2",
        renterId: "user_1",
        status: "requested",
        listing: { title: "Test Listing" },
      });
      mockRentalUpdate.mockResolvedValue({ id: "rental_1" });
      mockRentalEventCreate.mockResolvedValue({ id: "event_1" });

      await declineRental("rental_1");

      const txArg = mock$Transaction.mock.calls[0][0];
      expect(txArg).toBeInstanceOf(Array);
      expect(txArg).toHaveLength(2);
    });
  });

  describe("markReturned", () => {
    it("owner can mark active rental as returned using $transaction", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_2", name: "User 2" } });
      mockRentalFindUnique.mockResolvedValue({
        ownerId: "user_2",
        renterId: "user_1",
        status: "active",
        listing: { title: "Test Listing" },
      });
      mockRentalUpdate.mockResolvedValue({ id: "rental_1" });
      mockRentalEventCreate.mockResolvedValue({ id: "event_1" });

      const result = await markReturned("rental_1");
      expect(result).toEqual({ success: true });
      expect(mock$Transaction).toHaveBeenCalled();
    });
  });

  describe("completeRental", () => {
    it("returned rental transitions to completed using $transaction", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_2", name: "User 2" } });
      mockRentalFindUnique.mockResolvedValue({
        ownerId: "user_2",
        renterId: "user_1",
        status: "returned",
        listing: { title: "Test Listing" },
      });
      mockRentalUpdate.mockResolvedValue({ id: "rental_1" });
      mockRentalEventCreate.mockResolvedValue({ id: "event_1" });

      const result = await completeRental("rental_1");
      expect(result).toEqual({ success: true });
      expect(mock$Transaction).toHaveBeenCalled();
    });
  });

  describe("activateApprovedRentals", () => {
    it("transitions approved rentals past start date to active", async () => {
      mockRentalUpdateMany.mockResolvedValue({ count: 2 });

      const count = await activateApprovedRentals("user_1");
      expect(count).toBe(2);
      expect(mockRentalUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "approved",
            startDate: expect.objectContaining({ lte: expect.any(Date) }),
          }),
          data: { status: "active" },
        })
      );
    });
  });

  describe("queries", () => {
    it("getRentalsAsRenter returns rentals where user is renter", async () => {
      mockRentalFindMany.mockResolvedValue([
        { id: "rental_1", renterId: "user_1" },
      ]);

      const result = await getRentalsAsRenter("user_1");
      expect(result).toHaveLength(1);
      expect(mockRentalFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { renterId: "user_1" },
        })
      );
    });

    it("getRentalsAsOwner returns rentals where user is owner", async () => {
      mockRentalFindMany.mockResolvedValue([
        { id: "rental_1", ownerId: "user_2" },
      ]);

      const result = await getRentalsAsOwner("user_2");
      expect(result).toHaveLength(1);
      expect(mockRentalFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: "user_2" },
        })
      );
    });

    it("getRentalWithEvents returns rental with events ordered by createdAt asc", async () => {
      const mockRental = {
        id: "rental_1",
        events: [
          { id: "e1", status: "requested", createdAt: new Date("2026-03-01") },
          { id: "e2", status: "approved", createdAt: new Date("2026-03-02") },
        ],
        listing: { id: "listing_1", title: "Test", images: [], category: null },
        renter: { id: "user_1", name: "Renter", image: null },
        owner: { id: "user_2", name: "Owner", image: null },
      };
      mockRentalFindUnique.mockResolvedValue(mockRental);

      const result = await getRentalWithEvents("rental_1");
      expect(result).toEqual(mockRental);
      expect(mockRentalFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "rental_1" },
          include: expect.objectContaining({
            events: { orderBy: { createdAt: "asc" } },
          }),
        })
      );
    });
  });
});
