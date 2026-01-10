import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Get the current session from Better Auth.
 * Must be called from a Server Component or Server Action.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Fetch a user profile by ID with public-facing fields.
 */
export async function getUserProfile(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      location: true,
      averageRating: true,
      reviewCount: true,
      createdAt: true,
      role: true,
    },
  });
  return user;
}

/**
 * Fetch the currently authenticated user's profile.
 * Returns null if not authenticated.
 */
export async function getCurrentUserProfile() {
  const session = await getSession();
  if (!session) return null;
  return getUserProfile(session.user.id);
}
