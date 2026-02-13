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

// Mock Prisma
const mockConversationFindFirst = vi.fn();
const mockConversationFindUnique = vi.fn();
const mockConversationFindMany = vi.fn();
const mockConversationCreate = vi.fn();
const mockConversationUpdate = vi.fn();
const mockListingFindUnique = vi.fn();
const mockMessageCreate = vi.fn();
const mockMessageFindMany = vi.fn();
const mockMessageCount = vi.fn();
const mockMessageUpdateMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    conversation: {
      findFirst: (...args: unknown[]) => mockConversationFindFirst(...args),
      findUnique: (...args: unknown[]) => mockConversationFindUnique(...args),
      findMany: (...args: unknown[]) => mockConversationFindMany(...args),
      create: (...args: unknown[]) => mockConversationCreate(...args),
      update: (...args: unknown[]) => mockConversationUpdate(...args),
    },
    listing: {
      findUnique: (...args: unknown[]) => mockListingFindUnique(...args),
    },
    message: {
      create: (...args: unknown[]) => mockMessageCreate(...args),
      findMany: (...args: unknown[]) => mockMessageFindMany(...args),
      count: (...args: unknown[]) => mockMessageCount(...args),
      updateMany: (...args: unknown[]) => mockMessageUpdateMany(...args),
    },
  },
}));

import { getOrCreateConversation, sendMessage } from "../actions";
import {
  getConversations,
  getMessages,
  markMessagesRead,
  getUnreadCount,
} from "../queries";

describe("message actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrCreateConversation", () => {
    it("creates conversation tied to listing", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1" } });
      mockListingFindUnique.mockResolvedValue({
        id: "listing_1",
        ownerId: "user_2",
      });
      mockConversationFindFirst.mockResolvedValue(null);
      mockConversationCreate.mockResolvedValue({ id: "conv_new" });

      const result = await getOrCreateConversation("listing_1");
      expect(result).toEqual({ conversationId: "conv_new" });
      expect(mockConversationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            listingId: "listing_1",
            user1Id: "user_1",
            user2Id: "user_2",
          }),
        })
      );
    });

    it("returns existing conversation if one exists", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1" } });
      mockListingFindUnique.mockResolvedValue({
        id: "listing_1",
        ownerId: "user_2",
      });
      mockConversationFindFirst.mockResolvedValue({ id: "conv_existing" });

      const result = await getOrCreateConversation("listing_1");
      expect(result).toEqual({ conversationId: "conv_existing" });
      expect(mockConversationCreate).not.toHaveBeenCalled();
    });

    it("rejects messaging yourself", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1" } });
      mockListingFindUnique.mockResolvedValue({
        id: "listing_1",
        ownerId: "user_1",
      });

      const result = await getOrCreateConversation("listing_1");
      expect(result).toEqual({ error: "You cannot message yourself." });
    });
  });

  describe("sendMessage", () => {
    it("creates message in conversation", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_1" } });
      mockConversationFindUnique.mockResolvedValue({
        user1Id: "user_1",
        user2Id: "user_2",
      });
      mockMessageCreate.mockResolvedValue({
        id: "msg_1",
        content: "Hello",
        senderId: "user_1",
        sender: { id: "user_1", name: "Alice", image: null },
      });
      mockConversationUpdate.mockResolvedValue({});

      const result = await sendMessage({
        conversationId: "conv_1",
        content: "Hello",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(mockMessageCreate).toHaveBeenCalled();
    });

    it("rejects message from non-participant", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user_3" } });
      mockConversationFindUnique.mockResolvedValue({
        user1Id: "user_1",
        user2Id: "user_2",
      });

      const result = await sendMessage({
        conversationId: "conv_1",
        content: "Hello",
      });

      expect(result).toEqual({
        error: "You are not a participant in this conversation.",
      });
      expect(mockMessageCreate).not.toHaveBeenCalled();
    });
  });

  describe("queries", () => {
    it("getConversations returns conversations for user", async () => {
      mockConversationFindMany.mockResolvedValue([
        {
          id: "conv_1",
          user1Id: "user_1",
          user2Id: "user_2",
          listing: { id: "l1", title: "Drill", images: [{ url: "/img.jpg" }] },
          user1: { id: "user_1", name: "Alice", image: null },
          user2: { id: "user_2", name: "Bob", image: null },
          messages: [{ id: "m1", content: "Hi", createdAt: new Date(), senderId: "user_2" }],
          _count: { messages: 1 },
          updatedAt: new Date(),
        },
      ]);

      const result = await getConversations("user_1");
      expect(result).toHaveLength(1);
      expect(result[0].otherUser.id).toBe("user_2");
      expect(result[0].unreadCount).toBe(1);
    });

    it("getMessages returns messages in conversation ordered by date", async () => {
      mockConversationFindUnique.mockResolvedValue({
        user1Id: "user_1",
        user2Id: "user_2",
      });
      mockMessageFindMany.mockResolvedValue([
        { id: "m1", content: "Hi", createdAt: new Date("2026-01-01") },
        { id: "m2", content: "Hello", createdAt: new Date("2026-01-02") },
      ]);

      const result = await getMessages("conv_1", "user_1");
      expect(result).toHaveLength(2);
      expect(mockMessageFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "asc" },
        })
      );
    });

    it("markMessagesRead marks unread messages as read", async () => {
      mockMessageUpdateMany.mockResolvedValue({ count: 3 });

      await markMessagesRead("conv_1", "user_1");
      expect(mockMessageUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            conversationId: "conv_1",
            senderId: { not: "user_1" },
            read: false,
          }),
          data: { read: true },
        })
      );
    });

    it("getUnreadCount returns count of unread messages for user", async () => {
      mockConversationFindMany.mockResolvedValue([
        { id: "conv_1" },
        { id: "conv_2" },
      ]);
      mockMessageCount.mockResolvedValue(5);

      const count = await getUnreadCount("user_1");
      expect(count).toBe(5);
      expect(mockMessageCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            senderId: { not: "user_1" },
            read: false,
          }),
        })
      );
    });
  });
});
