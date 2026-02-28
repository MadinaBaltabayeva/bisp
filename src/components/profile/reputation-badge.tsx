"use client";

import { Shield, Repeat, Star, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserBadge, BadgeType } from "@/features/badges/queries";
import { cn } from "@/lib/utils";

const BADGE_ICONS: Record<BadgeType, typeof Shield> = {
  trusted_owner: Shield,
  active_renter: Repeat,
  top_rated: Star,
  new_member: Sparkles,
};

const BADGE_COLORS: Record<BadgeType, string> = {
  trusted_owner: "text-green-600",
  active_renter: "text-blue-600",
  top_rated: "text-amber-500",
  new_member: "text-gray-400",
};

export function ReputationBadge({ badge }: { badge: UserBadge }) {
  const t = useTranslations("Badges");
  const Icon = BADGE_ICONS[badge.type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        BADGE_COLORS[badge.type]
      )}
    >
      <Icon className="size-4" />
      <span className="text-xs font-medium">{t(badge.labelKey as "trustedOwner" | "activeRenter" | "topRated" | "newMember")}</span>
    </span>
  );
}

export function ReputationBadgeIcon({
  badge,
  className,
}: {
  badge: UserBadge;
  className?: string;
}) {
  const Icon = BADGE_ICONS[badge.type];

  return (
    <Icon
      className={cn("size-3.5", BADGE_COLORS[badge.type], className)}
    />
  );
}

export function ReputationBadges({ badges }: { badges: UserBadge[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {badges.map((badge) => (
        <ReputationBadge key={badge.type} badge={badge} />
      ))}
    </div>
  );
}
