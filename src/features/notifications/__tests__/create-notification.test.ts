import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock email
const mockSendNotificationEmail = vi.fn();
vi.mock("@/lib/email", () => ({
  sendNotificationEmail: (...args: unknown[]) =>
    mockSendNotificationEmail(...args),
}));

// Mock Prisma
const mockNotificationCreate = vi.fn();
const mockNotificationFindFirst = vi.fn();
const mockNotificationUpdate = vi.fn();
const mockUserFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      create: (...args: unknown[]) => mockNotificationCreate(...args),
      findFirst: (...args: unknown[]) => mockNotificationFindFirst(...args),
      update: (...args: unknown[]) => mockNotificationUpdate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}));

import { createNotification } from "../create-notification";

describe("createNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindUnique.mockResolvedValue({
      id: "recipient-1",
      email: "recipient@test.com",
      name: "Recipient",
      emailNotifications: true,
    });
    mockNotificationCreate.mockResolvedValue({ id: "notif-1" });
    mockNotificationFindFirst.mockResolvedValue(null);
    mockSendNotificationEmail.mockResolvedValue(undefined);
  });

  it("skips notification when recipientId equals actorId", async () => {
    await createNotification({
      recipientId: "user-1",
      actorId: "user-1",
      type: "rental",
      title: "Self notification",
      message: "Should not be created",
      linkUrl: "/rentals/1",
    });

    expect(mockNotificationCreate).not.toHaveBeenCalled();
    expect(mockSendNotificationEmail).not.toHaveBeenCalled();
  });

  it("creates a DB notification row", async () => {
    await createNotification({
      recipientId: "recipient-1",
      actorId: "actor-1",
      type: "rental",
      title: "New rental request",
      message: "Someone wants to rent your item",
      linkUrl: "/rentals/123",
    });

    expect(mockNotificationCreate).toHaveBeenCalledWith({
      data: {
        recipientId: "recipient-1",
        actorId: "actor-1",
        type: "rental",
        title: "New rental request",
        message: "Someone wants to rent your item",
        linkUrl: "/rentals/123",
      },
    });
  });

  it("sends email for rental type when user has emailNotifications enabled", async () => {
    await createNotification({
      recipientId: "recipient-1",
      actorId: "actor-1",
      type: "rental",
      title: "New rental request",
      message: "Someone wants to rent your item",
      linkUrl: "/rentals/123",
    });

    expect(mockSendNotificationEmail).toHaveBeenCalledWith({
      to: "recipient@test.com",
      recipientName: "Recipient",
      subject: "New rental request",
      body: "Someone wants to rent your item",
      linkUrl: expect.stringContaining("/rentals/123"),
    });
  });

  it("does NOT send email for favorite type", async () => {
    await createNotification({
      recipientId: "recipient-1",
      actorId: "actor-1",
      type: "favorite",
      title: "Listing favorited",
      message: "Someone favorited your listing",
      linkUrl: "/listings/123",
    });

    expect(mockNotificationCreate).toHaveBeenCalled();
    expect(mockSendNotificationEmail).not.toHaveBeenCalled();
  });

  it("does NOT send email when user has emailNotifications disabled", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "recipient-1",
      email: "recipient@test.com",
      name: "Recipient",
      emailNotifications: false,
    });

    await createNotification({
      recipientId: "recipient-1",
      actorId: "actor-1",
      type: "rental",
      title: "Rental update",
      message: "Your rental was approved",
      linkUrl: "/rentals/123",
    });

    expect(mockNotificationCreate).toHaveBeenCalled();
    expect(mockSendNotificationEmail).not.toHaveBeenCalled();
  });

  it("catches email errors without failing", async () => {
    mockSendNotificationEmail.mockRejectedValue(new Error("SMTP error"));

    await expect(
      createNotification({
        recipientId: "recipient-1",
        actorId: "actor-1",
        type: "rental",
        title: "Rental update",
        message: "Body",
        linkUrl: "/rentals/123",
      })
    ).resolves.not.toThrow();

    expect(mockNotificationCreate).toHaveBeenCalled();
  });

  it("deduplicates message-type notifications by updating existing", async () => {
    mockNotificationFindFirst.mockResolvedValue({
      id: "existing-notif",
      linkUrl: "/messages/conv-1",
    });

    await createNotification({
      recipientId: "recipient-1",
      actorId: "actor-1",
      type: "message",
      title: "New message",
      message: "You have a new message",
      linkUrl: "/messages/conv-1",
    });

    expect(mockNotificationUpdate).toHaveBeenCalledWith({
      where: { id: "existing-notif" },
      data: expect.objectContaining({ createdAt: expect.any(Date) }),
    });
    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });
});
