"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { VerificationBadgeIcon } from "@/components/profile/verification-badge";
import { ReputationBadgeIcon } from "@/components/profile/reputation-badge";
import type { UserBadge } from "@/features/badges/queries";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { AvailabilityToggle } from "@/components/listings/availability-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    priceDaily: number | null;
    priceHourly: number | null;
    priceWeekly: number | null;
    priceMonthly: number | null;
    location: string;
    aiVerified: boolean;
    images: Array<{ id: string; url: string; isCover: boolean }>;
    category: { id: string; name: string; slug: string };
    owner?: { idVerified: boolean };
  };
  highlightTerms?: string[];
  isFavorited?: boolean;
  isAuthenticated?: boolean;
  showFavoriteButton?: boolean;
  status?: string;
  showAvailabilityToggle?: boolean;
  ownerBadges?: UserBadge[];
}

function highlightText(text: string, terms?: string[]): ReactNode {
  if (!terms || terms.length === 0) return text;

  const escaped = terms.map((t) =>
    t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="rounded bg-yellow-200 px-0.5 text-gray-900">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function ListingCard({
  listing,
  highlightTerms,
  isFavorited = false,
  isAuthenticated = false,
  showFavoriteButton = true,
  status,
  showAvailabilityToggle = false,
  ownerBadges,
}: ListingCardProps) {
  const t = useTranslations("Listings.card");
  const ta = useTranslations("Listings.availability");
  const coverImage = listing.images.find((img) => img.isCover) ?? listing.images[0];
  const isUnavailable = status === "unavailable";

  function formatPrice(): string {
    if (listing.priceDaily != null) {
      return `$${listing.priceDaily}${t("perDay")}`;
    }
    if (listing.priceHourly != null) {
      return `$${listing.priceHourly}${t("perHour")}`;
    }
    if (listing.priceWeekly != null) {
      return `$${listing.priceWeekly}${t("perWeek")}`;
    }
    if (listing.priceMonthly != null) {
      return `$${listing.priceMonthly}${t("perMonth")}`;
    }
    return t("contactForPrice");
  }

  const priceLabel = formatPrice();

  return (
    <div className={cn("group", isUnavailable && "opacity-60")}>
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] bg-stone-100">
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-stone-100 text-stone-400">
              {t("noPhoto")}
            </div>
          )}
          {showFavoriteButton && (
            <div className="absolute right-2 top-2 z-10">
              <FavoriteButton
                listingId={listing.id}
                isFavorited={isFavorited}
                isAuthenticated={isAuthenticated}
              />
            </div>
          )}
          {isUnavailable && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Badge variant="secondary" className="bg-gray-900/70 text-white text-sm px-3 py-1">
                {ta("unavailable")}
              </Badge>
            </div>
          )}
        </div>

        <div className="mt-2.5">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[13px] font-medium text-stone-900">
              {highlightText(listing.title, highlightTerms)}
            </h3>
            {listing.owner?.idVerified && <VerificationBadgeIcon className="shrink-0" />}
            {ownerBadges?.map((badge) => (
              <ReputationBadgeIcon key={badge.type} badge={badge} className="shrink-0" />
            ))}
            {listing.aiVerified && (
              <ShieldCheck className="size-3.5 shrink-0 text-stone-500" aria-label={t("aiVerified")} />
            )}
          </div>
          <div className="mt-1 flex items-center justify-between text-[12px] text-stone-500">
            <span className="text-stone-900">{priceLabel}</span>
            <span className="truncate">{listing.location}</span>
          </div>
        </div>
      </Link>

      {showAvailabilityToggle && (
        <div className="mt-3">
          <AvailabilityToggle
            listingId={listing.id}
            isAvailable={!isUnavailable}
          />
        </div>
      )}
    </div>
  );
}
