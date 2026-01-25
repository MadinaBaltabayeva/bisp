"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { messageSchema } from "@/lib/validations/message";
import { getSession } from "@/features/auth/queries";
import { checkNotSuspended } from "@/features/admin/queries";

/**
 * Get or create a conversation between the current user and the listing owner.
 * Deduplicates by checking both user orderings for the same listing.
 */
export async function getOrCreateConversation(listingId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to message the owner." };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, ownerId: true },
  });

  if (!listing) {
    return { error: "Listing not found." };
  }

  // Prevent messaging yourself
  if (session.user.id === listing.ownerId) {
    return { error: "You cannot message yourself." };
  }

  try {
    // Check for existing conversation (either user ordering)
    const existing = await prisma.conversation.findFirst({
      where: {
        listingId,
        OR: [
          { user1Id: session.user.id, user2Id: listing.ownerId },
          { user1Id: listing.ownerId, user2Id: session.user.id },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      return { conversationId: existing.id };
    }

    // Create new conversation (initiator = user1)
    const conversation = await prisma.conversation.create({
      data: {
        listingId,
        user1Id: session.user.id,
        user2Id: listing.ownerId,
      },
    });

    return { conversationId: conversation.id };
  } catch (error) {
    console.error("Failed to get or create conversation:", error);
    return { error: "Failed to start conversation. Please try again." };
  }
}

/**
 * Send a message in a conversation.
 * Validates user is a participant and updates conversation timestamp.
 */
export async function sendMessage(data: unknown) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to send messages." };
  }

  const suspended = await checkNotSuspended();
  if (suspended.error) return { error: suspended.error };

  const result = messageSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0];
    return { error: firstError || "Invalid message." };
  }

  const { conversationId, content } = result.data;

  // Verify user is a participant
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { user1Id: true, user2Id: true },
  });

  if (!conversation) {
    return { error: "Conversation not found." };
  }

  if (
    conversation.user1Id !== session.user.id &&
    conversation.user2Id !== session.user.id
  ) {
    return { error: "You are not a participant in this conversation." };
  }

  try {
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        conversationId,
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // Touch conversation updatedAt for sorting
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    revalidatePath("/messages");

    return { success: true, message };
  } catch (error) {
    console.error("Failed to send message:", error);
    return { error: "Failed to send message. Please try again." };
  }
}
