import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/queries";
import { getUnreadNotificationCount } from "@/features/notifications/queries";

/**
 * GET /api/notifications/unread
 * Returns the unread notification count for the current user.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ count: 0 });
  }

  const count = await getUnreadNotificationCount(session.user.id);
  return NextResponse.json({ count });
}
