"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { MapPin, ShieldCheck } from "lucide-react";
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
    <div className={cn("rounded-2xl shadow-warm-sm hover:shadow-warm-md transition-shadow duration-300 bg-white overflow-hidden", isUnavailable && "opacity-60")}>
      <Link href={`/listings/${listing.id}`} className="group block">
        <div className="relative aspect-[3/2] bg-gradient-to-br from-stone-100 to-stone-200">
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              {t("noPhoto")}
            </div>
          )}
          {/* Price badge overlay (bottom-left) */}
          <div className="absolute bottom-2.5 left-2.5 z-10 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1 shadow-warm-xs">
            <span className="text-sm font-bold text-stone-900">{priceLabel}</span>
          </div>
          {/* Favorite heart overlay (top-right) */}
          {showFavoriteButton && (
            <div className="absolute right-2 top-2 z-10 rounded-full bg-white/80 shadow-warm-xs backdrop-blur-sm">
              <FavoriteButton
                listingId={listing.id}
                isFavorited={isFavorited}
                isAuthenticated={isAuthenticated}
              />
            </div>
          )}
          {/* Unavailable badge overlay */}
          {isUnavailable && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Badge variant="secondary" className="bg-gray-900/70 text-white text-sm px-3 py-1">
                {ta("unavailable")}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-stone-900 group-hover:text-primary-600 transition-colors">
              {highlightText(listing.title, highlightTerms)}
            </h3>
            {listing.owner?.idVerified && <VerificationBadgeIcon className="shrink-0" />}
            {ownerBadges?.map((badge) => (
              <ReputationBadgeIcon key={badge.type} badge={badge} className="shrink-0" />
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-block rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
              {listing.category.name}
            </span>
            {listing.aiVerified && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                <ShieldCheck className="size-3" />
                {t("aiVerified")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-stone-500">
            <MapPin className="size-3.5 shrink-0 text-stone-400" />
            <span className="truncate">{listing.location}</span>
          </div>
        </div>
      </Link>

      {/* Availability toggle for owner's listings */}
      {showAvailabilityToggle && (
        <div className="px-3 pb-3 mt-0">
          <AvailabilityToggle
            listingId={listing.id}
            isAvailable={!isUnavailable}
          />
        </div>
      )}
    </div>
  );
}
