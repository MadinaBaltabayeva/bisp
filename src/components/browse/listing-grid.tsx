import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/listings/listing-card";

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

interface ListingGridProps {
  listings: Listing[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function ListingGrid({ listings, loading }: ListingGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PackageSearch className="mb-4 size-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-gray-900">
          No listings found
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters or search terms
        </p>
        <Link
          href="/browse"
          className="mt-4 text-sm font-medium text-primary-600 hover:underline"
        >
          Clear all filters
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
