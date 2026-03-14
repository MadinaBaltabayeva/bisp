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
      <mark key={i} className="rounded bg-amber-200 px-0.5 text-gray-900">
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
    <div className={cn("rounded-xl bg-white shadow-warm hover:shadow-warm-lg transition-all duration-300 overflow-hidden", isUnavailable && "opacity-60")}>
      <Link href={`/listings/${listing.id}`} className="group block">
        <div className="overflow-hidden">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200">
            {coverImage ? (
              <Image
                src={coverImage.url}
                alt={listing.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                {t("noPhoto")}
              </div>
            )}
            {/* Favorite heart overlay (top-left) */}
            {showFavoriteButton && (
              <div className="absolute left-2 top-2 z-10 rounded-full bg-white/70 shadow-sm backdrop-blur-sm">
                <FavoriteButton
                  listingId={listing.id}
                  isFavorited={isFavorited}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            )}
            {/* AI Verified badge (top-right) */}
            {listing.aiVerified && (
              <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                <ShieldCheck className="size-3" />
                {t("aiVerified")}
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
        </div>

        <div className="p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
              {highlightText(listing.title, highlightTerms)}
            </h3>
            {listing.owner?.idVerified && <VerificationBadgeIcon className="shrink-0" />}
            {ownerBadges?.map((badge) => (
              <ReputationBadgeIcon key={badge.type} badge={badge} className="shrink-0" />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{listing.category.name}</p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>
          <p className="font-semibold text-amber-700">
            {t("from", { price: priceLabel })}
          </p>
        </div>
      </Link>

      {/* Availability toggle for owner's listings */}
      {showAvailabilityToggle && (
        <div className="px-3 pb-3">
          <AvailabilityToggle
            listingId={listing.id}
            isAvailable={!isUnavailable}
          />
        </div>
      )}
    </div>
  );
}
