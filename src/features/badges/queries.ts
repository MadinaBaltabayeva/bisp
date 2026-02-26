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

export async function getUserBadges(_userId: string): Promise<UserBadge[]> {
  // TODO: implement
  return [];
}

export async function getUsersBadges(
  _userIds: string[]
): Promise<Map<string, UserBadge[]>> {
  // TODO: implement
  return new Map();
}
