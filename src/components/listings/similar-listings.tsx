import { getTranslations } from "next-intl/server";
import { getSimilarListings } from "@/features/listings/queries";
import { ListingCard } from "@/components/listings/listing-card";

interface SimilarListingsProps {
  listingId: string;
  categoryId: string;
  favoriteIds: Set<string>;
  isAuthenticated: boolean;
}

export async function SimilarListings({
  listingId,
  categoryId,
  favoriteIds,
  isAuthenticated,
}: SimilarListingsProps) {
  const [listings, t] = await Promise.all([
    getSimilarListings(listingId, categoryId),
    getTranslations("Listings.similar"),
  ]);

  if (listings.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 border-t pt-8">
      <h2 className="text-lg font-semibold text-gray-900">{t("heading")}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isFavorited={favoriteIds.has(listing.id)}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>
    </div>
  );
}
