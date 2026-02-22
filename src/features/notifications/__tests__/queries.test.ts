import { describe, it, expect, vi, beforeEach } from "vitest";

const mockNotificationCount = vi.fn();
const mockNotificationFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      count: (...args: unknown[]) => mockNotificationCount(...args),
      findMany: (...args: unknown[]) => mockNotificationFindMany(...args),
    },
  },
}));

import {
  getUnreadNotificationCount,
  getNotifications,
} from "../queries";

describe("getUnreadNotificationCount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns count of unread notifications for a user", async () => {
    mockNotificationCount.mockResolvedValue(5);

    const count = await getUnreadNotificationCount("user-1");

    expect(count).toBe(5);
    expect(mockNotificationCount).toHaveBeenCalledWith({
      where: { recipientId: "user-1", read: false },
    });
  });
});

describe("getNotifications", () => {
  beforeEach(() => vi.clearAllMocks());

  const mockNotifications = [
    {
      id: "n1",
      type: "rental",
      title: "Rental approved",
      message: "",
      linkUrl: "/rentals/1",
      read: false,
      createdAt: new Date("2026-03-08"),
      actor: { id: "a1", name: "Alice", image: null },
    },
    {
      id: "n2",
      type: "message",
      title: "New message",
      message: "",
      linkUrl: "/messages/1",
      read: true,
      createdAt: new Date("2026-03-07"),
      actor: { id: "a2", name: "Bob", image: "/bob.jpg" },
    },
  ];

  it("returns notifications ordered by createdAt desc with actor info", async () => {
    mockNotificationFindMany.mockResolvedValue(mockNotifications);

    const result = await getNotifications("user-1");

    expect(result).toEqual(mockNotifications);
    expect(mockNotificationFindMany).toHaveBeenCalledWith({
      where: { recipientId: "user-1" },
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true, image: true } },
      },
      take: undefined,
    });
  });

  it("respects limit parameter", async () => {
    mockNotificationFindMany.mockResolvedValue([mockNotifications[0]]);

    await getNotifications("user-1", 1);

    expect(mockNotificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 1 })
    );
  });
});
