import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/queries";
import { getNotifications } from "@/features/notifications/queries";

/**
 * GET /api/notifications/recent
 * Returns the 10 most recent notifications for the current user.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ notifications: [] });
  }

  const notifications = await getNotifications(session.user.id, 10);
  return NextResponse.json({ notifications });
}
