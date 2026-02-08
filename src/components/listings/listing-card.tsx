"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { MapPin, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { VerificationBadgeIcon } from "@/components/profile/verification-badge";

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

export function ListingCard({ listing, highlightTerms }: ListingCardProps) {
  const t = useTranslations("Listings.card");
  const coverImage = listing.images.find((img) => img.isCover) ?? listing.images[0];

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
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="overflow-hidden rounded-lg">
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
          {listing.aiVerified && (
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-green-600/90 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              <ShieldCheck className="size-3" />
              {t("aiVerified")}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
            {highlightText(listing.title, highlightTerms)}
          </h3>
          {listing.owner?.idVerified && <VerificationBadgeIcon className="shrink-0" />}
        </div>
        <p className="text-sm text-muted-foreground">{listing.category.name}</p>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>
        <p className="font-semibold text-primary-600">
          {t("from", { price: priceLabel })}
        </p>
      </div>
    </Link>
  );
}
