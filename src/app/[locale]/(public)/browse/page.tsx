import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { searchSchema } from "@/lib/validations/listing";
import { searchListings } from "@/features/listings/queries";
import { SearchBar } from "@/components/browse/search-bar";
import { SortSelect } from "@/components/browse/sort-select";
import { FilterSidebar } from "@/components/browse/filter-sidebar";
import { ListingGrid } from "@/components/browse/listing-grid";
import { LazyMapView } from "@/components/map/lazy-map-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Browse Listings - RentHub",
};

interface BrowsePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const rawParams = await searchParams;

  // Flatten array params to first value for Zod parsing
  const flatParams: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    flatParams[key] = Array.isArray(value) ? value[0] : value;
  }

  const parsed = searchSchema.parse(flatParams);
  const listings = await searchListings(parsed);
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

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

      {/* Main content with sidebar */}
      <div className="flex gap-8">
        {/* Filter sidebar: shows desktop aside + mobile sheet trigger */}
        <Suspense>
          <FilterSidebar {...filterProps} />
        </Suspense>

        {/* Grid + Map tabs */}
        <div className="min-w-0 flex-1">
          <Tabs defaultValue="grid">
            <TabsList className="mb-4">
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
            </TabsList>

            <TabsContent value="grid">
              <ListingGrid listings={listings} />
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
