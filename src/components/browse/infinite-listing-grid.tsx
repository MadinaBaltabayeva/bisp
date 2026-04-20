"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PackageSearch } from "lucide-react";
import { ListingCard } from "@/components/listings/listing-card";
import { loadMoreListings } from "@/features/listings/actions";
import type { SearchParams } from "@/lib/validations/listing";

interface Listing {
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
}

interface InfiniteListingGridProps {
  initialListings: Listing[];
  initialHasMore: boolean;
  highlightTerms?: string[];
  favoriteIds?: string[];
  isAuthenticated?: boolean;
  searchParams: SearchParams;
}

export function InfiniteListingGrid({
  initialListings,
  initialHasMore,
  highlightTerms,
  favoriteIds = [],
  isAuthenticated = false,
  searchParams,
}: InfiniteListingGridProps) {
  const t = useTranslations("Browse");
  const [listings, setListings] = useState(initialListings);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const favoriteSet = new Set(favoriteIds);

  useEffect(() => {
    setListings(initialListings);
    setHasMore(initialHasMore);
  }, [initialListings, initialHasMore]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setLoading(true);
        try {
          const next = await loadMoreListings(searchParams, listings.length);
          setListings((prev) => [...prev, ...next.listings]);
          setHasMore(next.hasMore);
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, listings.length, searchParams]);

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PackageSearch className="mb-4 size-12 text-stone-400" />
        <h3 className="font-serif text-xl font-medium text-stone-900">
          {t("noResults")}
        </h3>
        <p className="mt-1 text-sm text-stone-500">{t("noResultsHint")}</p>
        <Link
          href="/browse"
          className="mt-4 text-sm text-stone-700 hover:text-stone-900 hover:underline underline-offset-4"
        >
          {t("filters.reset")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            highlightTerms={highlightTerms}
            isFavorited={favoriteSet.has(listing.id)}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="h-px w-full" aria-hidden />

      <div className="mt-8 text-center text-[12px] text-stone-500">
        {loading ? "Loading…" : hasMore ? null : listings.length > 0 ? "Nothing more to show." : null}
      </div>
    </>
  );
}
