import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/db";
import { searchSchema } from "@/lib/validations/listing";
import { searchListings } from "@/features/listings/queries";
import { getSession } from "@/features/auth/queries";
import { getUserFavoriteIds } from "@/features/favorites/queries";
import { SearchBar } from "@/components/browse/search-bar";
import { SortSelect } from "@/components/browse/sort-select";
import { FilterSidebar } from "@/components/browse/filter-sidebar";
import { InfiniteListingGrid } from "@/components/browse/infinite-listing-grid";
import { DidYouMean } from "@/components/browse/did-you-mean";
import { LazyMapView } from "@/components/map/lazy-map-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrackSearchImpressions } from "@/components/analytics/track-impressions";

export const metadata: Metadata = {
  title: "Browse Listings - RentHub",
};

interface BrowsePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BrowsePage({ params, searchParams }: BrowsePageProps) {
  const { locale } = await params;
  setRequestLocale(locale as (typeof routing.locales)[number]);
  const t = await getTranslations("Browse");
  const rawParams = await searchParams;

  // Flatten array params to first value for Zod parsing
  const flatParams: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    flatParams[key] = Array.isArray(value) ? value[0] : value;
  }

  const parsed = searchSchema.parse(flatParams);
  const [{ listings, suggestion, highlightTerms, hasMore }, categories, session] = await Promise.all([
    searchListings(parsed),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    getSession(),
  ]);

  // Fetch favorite IDs for the current user
  let favoriteIds: string[] = [];
  if (session) {
    const favSet = await getUserFavoriteIds(session.user.id);
    favoriteIds = Array.from(favSet);
  }

  const filterProps = {
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),
    totalResults: listings.length,
  };

  // Format listings for map
  const mapListings = listings
    .filter((l) => l.latitude != null && l.longitude != null)
    .map((l) => {
      let priceLabel = "Contact for price";
      if (l.priceDaily != null) priceLabel = `$${l.priceDaily}/day`;
      else if (l.priceHourly != null) priceLabel = `$${l.priceHourly}/hr`;
      else if (l.priceWeekly != null) priceLabel = `$${l.priceWeekly}/wk`;
      else if (l.priceMonthly != null) priceLabel = `$${l.priceMonthly}/mo`;

      return {
        id: l.id,
        lat: l.latitude!,
        lng: l.longitude!,
        title: l.title,
        price: priceLabel,
      };
    });

  // Extract user location and radius from params for map
  const userLocation: [number, number] | undefined =
    parsed.latitude != null && parsed.longitude != null
      ? [parsed.latitude, parsed.longitude]
      : undefined;
  const radiusParam = parsed.radius ?? undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top bar: Search + Mobile filter trigger + Sort */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Suspense>
          <SearchBar />
        </Suspense>
        <div className="flex items-center gap-3">
          <Suspense>
            <SortSelect />
          </Suspense>
        </div>
      </div>

      {/* Did you mean? suggestion banner */}
      {suggestion && parsed.q && (
        <Suspense>
          <DidYouMean suggestion={suggestion} currentQuery={parsed.q} />
        </Suspense>
      )}

      {/* Main content with sidebar */}
      <div className="flex gap-8">
        {/* Filter sidebar: shows desktop aside + mobile sheet trigger */}
        <Suspense>
          <FilterSidebar {...filterProps} />
        </Suspense>

        {/* Search impression tracking */}
        <TrackSearchImpressions listingIds={listings.map((l) => l.id)} />

        {/* Grid + Map tabs */}
        <div className="min-w-0 flex-1">
          <Tabs defaultValue="grid">
            <TabsList className="mb-4">
              <TabsTrigger value="grid">{t("listView")}</TabsTrigger>
              <TabsTrigger value="map">{t("mapView")}</TabsTrigger>
            </TabsList>

            <TabsContent value="grid">
              <InfiniteListingGrid
                initialListings={listings}
                initialHasMore={hasMore}
                highlightTerms={highlightTerms}
                favoriteIds={favoriteIds}
                isAuthenticated={!!session}
                searchParams={parsed}
              />
            </TabsContent>

            <TabsContent value="map">
              <LazyMapView
                listings={mapListings}
                radius={radiusParam}
                userLocation={userLocation}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
