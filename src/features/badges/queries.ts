import { prisma } from "@/lib/db";

export type BadgeType =
  | "new_member"
  | "trusted_owner"
  | "active_renter"
  | "top_rated";

export interface UserBadge {
  type: BadgeType;
  labelKey: string;
}

export const BADGE_CONFIG = {
  trusted_owner: { labelKey: "trustedOwner" },
  active_renter: { labelKey: "activeRenter" },
  top_rated: { labelKey: "topRated" },
  new_member: { labelKey: "newMember" },
} as const;

function computeBadges(
  ownerCount: number,
  renterCount: number,
  averageRating: number,
  reviewCount: number
): UserBadge[] {
  const badges: UserBadge[] = [];

  if (ownerCount >= 3) {
    badges.push({
      type: "trusted_owner",
      labelKey: BADGE_CONFIG.trusted_owner.labelKey,
    });
  }

  if (renterCount >= 3) {
    badges.push({
      type: "active_renter",
      labelKey: BADGE_CONFIG.active_renter.labelKey,
    });
  }

  if (averageRating >= 4.5 && reviewCount >= 2) {
    badges.push({
      type: "top_rated",
      labelKey: BADGE_CONFIG.top_rated.labelKey,
    });
  }

  // New Member badge only when no other badges earned
  if (badges.length === 0) {
    badges.push({
      type: "new_member",
      labelKey: BADGE_CONFIG.new_member.labelKey,
    });
  }

  return badges;
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const [ownerCount, renterCount, user] = await Promise.all([
    prisma.rental.count({
      where: { ownerId: userId, status: "completed" },
    }),
    prisma.rental.count({
      where: { renterId: userId, status: "completed" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { averageRating: true, reviewCount: true },
    }),
  ]);

  return computeBadges(
    ownerCount,
    renterCount,
    user?.averageRating ?? 0,
    user?.reviewCount ?? 0
  );
}

export async function getUsersBadges(
  userIds: string[]
): Promise<Map<string, UserBadge[]>> {
  const uniqueIds = [...new Set(userIds)];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const [ownerGroups, renterGroups, users] = await Promise.all([
    prisma.rental.groupBy({
      by: ["ownerId"],
      where: { ownerId: { in: uniqueIds }, status: "completed" },
      _count: { _all: true },
    }),
    prisma.rental.groupBy({
      by: ["renterId"],
      where: { renterId: { in: uniqueIds }, status: "completed" },
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, averageRating: true, reviewCount: true },
    }),
  ]);

  // Build lookup maps
  const ownerCountMap = new Map<string, number>();
  for (const group of ownerGroups) {
    ownerCountMap.set(group.ownerId, group._count._all);
  }

  const renterCountMap = new Map<string, number>();
  for (const group of renterGroups) {
    renterCountMap.set(group.renterId, group._count._all);
  }

  const userStatsMap = new Map<
    string,
    { averageRating: number; reviewCount: number }
  >();
  for (const user of users) {
    userStatsMap.set(user.id, {
      averageRating: user.averageRating,
      reviewCount: user.reviewCount,
    });
  }

  // Compute badges for each user
  const result = new Map<string, UserBadge[]>();
  for (const userId of uniqueIds) {
    const ownerCount = ownerCountMap.get(userId) ?? 0;
    const renterCount = renterCountMap.get(userId) ?? 0;
    const stats = userStatsMap.get(userId);
    const badges = computeBadges(
      ownerCount,
      renterCount,
      stats?.averageRating ?? 0,
      stats?.reviewCount ?? 0
    );
    result.set(userId, badges);
  }

  return result;
}
