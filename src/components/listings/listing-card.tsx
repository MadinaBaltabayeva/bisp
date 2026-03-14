"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { MapPin, ShieldCheck, ShoppingBag } from "lucide-react";
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
    <div className={cn(
      "group relative rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-900/10",
      isUnavailable && "opacity-60"
    )}>
      <Link href={`/listings/${listing.id}`} className="block">
        {/* Image section — taller, with overlays */}
        <div className="relative aspect-[3/2] overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200">
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-300">
              <ShoppingBag className="size-12" />
            </div>
          )}

          {/* Gradient overlay at bottom of image */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Price badge on image */}
          <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-2.5 py-1 text-sm font-bold text-amber-700 shadow-sm backdrop-blur-sm">
            {t("from", { price: priceLabel })}
          </div>

          {/* Favorite heart (top-right) */}
          {showFavoriteButton && (
            <div className="absolute right-3 top-3 z-10">
              <div className="rounded-full bg-white/80 shadow-sm backdrop-blur-sm">
                <FavoriteButton
                  listingId={listing.id}
                  isFavorited={isFavorited}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            </div>
          )}

          {/* AI Verified badge (top-left) */}
          {listing.aiVerified && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-1 text-xs font-semibold text-white shadow-sm">
              <ShieldCheck className="size-3" />
              {t("aiVerified")}
            </div>
          )}

          {/* Unavailable overlay */}
          {isUnavailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <Badge variant="secondary" className="bg-white/90 text-stone-700 text-sm px-4 py-1.5 font-medium">
                {ta("unavailable")}
              </Badge>
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="p-4 space-y-2">
          <div className="flex items-start gap-1.5">
            <h3 className="flex-1 truncate text-base font-semibold text-stone-800 group-hover:text-amber-700 transition-colors">
              {highlightText(listing.title, highlightTerms)}
            </h3>
            {listing.owner?.idVerified && <VerificationBadgeIcon className="shrink-0 mt-0.5" />}
            {ownerBadges?.map((badge) => (
              <ReputationBadgeIcon key={badge.type} badge={badge} className="shrink-0 mt-0.5" />
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              {listing.category.name}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              <span className="truncate">{listing.location}</span>
            </span>
          </div>
        </div>
      </Link>

      {showAvailabilityToggle && (
        <div className="border-t border-stone-100 px-4 py-2.5">
          <AvailabilityToggle listingId={listing.id} isAvailable={!isUnavailable} />
        </div>
      )}
    </div>
  );
}
