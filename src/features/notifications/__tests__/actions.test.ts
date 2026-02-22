import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockGetSession = vi.fn();
vi.mock("@/features/auth/queries", () => ({
  getSession: () => mockGetSession(),
}));

const mockNotificationUpdateMany = vi.fn();
const mockUserUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      updateMany: (...args: unknown[]) => mockNotificationUpdateMany(...args),
    },
    user: {
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  },
}));

import {
  markNotificationRead,
  markAllNotificationsRead,
  updateEmailPreference,
} from "../actions";

describe("markNotificationRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockNotificationUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("marks a single notification as read for the session user", async () => {
    await markNotificationRead("notif-1");

    expect(mockNotificationUpdateMany).toHaveBeenCalledWith({
      where: { id: "notif-1", recipientId: "user-1" },
      data: { read: true },
    });
  });

  it("returns error when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await markNotificationRead("notif-1");

    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockNotificationUpdateMany).not.toHaveBeenCalled();
  });
});

describe("markAllNotificationsRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockNotificationUpdateMany.mockResolvedValue({ count: 3 });
  });

  it("marks all unread notifications as read for session user", async () => {
    await markAllNotificationsRead();

    expect(mockNotificationUpdateMany).toHaveBeenCalledWith({
      where: { recipientId: "user-1", read: false },
      data: { read: true },
    });
  });

  it("returns error when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await markAllNotificationsRead();

    expect(result).toEqual({ error: "Not authenticated" });
  });
});

describe("updateEmailPreference", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockUserUpdate.mockResolvedValue({ id: "user-1", emailNotifications: false });
  });

  it("updates user emailNotifications field", async () => {
    await updateEmailPreference(false);

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { emailNotifications: false },
    });
  });

  it("returns error when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await updateEmailPreference(true);

    expect(result).toEqual({ error: "Not authenticated" });
  });
});
