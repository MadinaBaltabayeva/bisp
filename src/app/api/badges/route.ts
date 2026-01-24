import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/queries";
import { getPendingActionCount } from "@/features/rentals/queries";
import { getUnreadCount } from "@/features/messages/queries";

/**
 * GET /api/badges
 * Returns badge counts for nav items (rentals needing attention + unread messages).
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ rentals: 0, messages: 0 });
  }

  const [pendingActions, unreadMessages] = await Promise.all([
    getPendingActionCount(session.user.id),
    getUnreadCount(session.user.id),
  ]);

  return NextResponse.json({
    rentals: pendingActions.asOwner + pendingActions.asRenter,
    messages: unreadMessages,
  });
}
