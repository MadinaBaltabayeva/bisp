import { prisma } from "@/lib/db";

/**
 * Get all conversations for a user with last message preview and unread counts.
 * Returns computed "otherUser" field for display convenience.
 */
export async function getConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      listing: {
        select: { id: true, title: true, images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } } },
      },
      user1: {
        select: { id: true, name: true, image: true },
      },
      user2: {
        select: { id: true, name: true, image: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: userId },
              read: false,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return conversations.map((conv) => ({
    id: conv.id,
    listing: {
      id: conv.listing.id,
      title: conv.listing.title,
      image: conv.listing.images[0]?.url ?? null,
    },
    otherUser: conv.user1Id === userId ? conv.user2 : conv.user1,
    lastMessage: conv.messages[0] ?? null,
    unreadCount: conv._count.messages,
    updatedAt: conv.updatedAt,
  }));
}

/**
 * Get all messages in a conversation.
 * Verifies user is a participant before returning.
 */
export async function getMessages(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { user1Id: true, user2Id: true },
  });

  if (!conversation) return null;
  if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
    return null;
  }

  return prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Get total unread message count for a user (for nav badge).
 */
export async function getUnreadCount(userId: string) {
  // Find all conversation IDs where user is a participant
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    select: { id: true },
  });

  const conversationIds = conversations.map((c) => c.id);

  if (conversationIds.length === 0) return 0;

  return prisma.message.count({
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: userId },
      read: false,
    },
  });
}

/**
 * Mark all unread messages in a conversation as read (for the receiving user).
 */
export async function markMessagesRead(
  conversationId: string,
  userId: string
) {
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      read: false,
    },
    data: { read: true },
  });
}

/**
 * Get conversation details including participant info and listing.
 * Used by the conversation page to render chat view.
 */
export async function getConversationById(
  conversationId: string,
  userId: string
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: {
        select: { id: true, title: true },
      },
      user1: {
        select: { id: true, name: true, image: true },
      },
      user2: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  if (!conversation) return null;
  if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
    return null;
  }

  return {
    id: conversation.id,
    listing: conversation.listing,
    otherUser:
      conversation.user1Id === userId ? conversation.user2 : conversation.user1,
    currentUser:
      conversation.user1Id === userId ? conversation.user1 : conversation.user2,
  };
}
