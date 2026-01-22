import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/queries";

/**
 * GET /api/messages/[conversationId]
 * Lightweight polling endpoint for fetching messages.
 * Also marks unread messages as read for the current user.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  // Verify user is a participant
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { user1Id: true, user2Id: true },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  if (
    conversation.user1Id !== session.user.id &&
    conversation.user2Id !== session.user.id
  ) {
    return NextResponse.json(
      { error: "Not a participant" },
      { status: 404 }
    );
  }

  // Fetch messages
  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Mark unread messages as read
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.user.id },
      read: false,
    },
    data: { read: true },
  });

  return NextResponse.json({ messages });
}
