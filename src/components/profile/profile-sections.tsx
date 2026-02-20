import { Package, Star, UserCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Separator } from "@/components/ui/separator";
import { ReviewCard } from "@/components/reviews/review-card";
import { ListingCard } from "@/components/listings/listing-card";

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  reviewer: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface ListingData {
  id: string;
  title: string;
  status: string;
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

interface ProfileSectionsProps {
  user: {
    bio: string;
  };
  isOwnProfile: boolean;
  reviews?: ReviewData[];
  listings?: ListingData[];
  favoriteIds?: Set<string>;
  isAuthenticated?: boolean;
}

function SectionHeading({
  icon: Icon,
  title,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count?: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="size-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="text-sm text-muted-foreground">({count})</span>
        )}
      </div>
      <Separator />
    </div>
  );
}

export async function ProfileSections({
  user,
  isOwnProfile,
  reviews = [],
  listings = [],
  favoriteIds = new Set(),
  isAuthenticated = false,
}: ProfileSectionsProps) {
  const t = await getTranslations("Profile");

  return (
    <div className="space-y-8">
      {/* Listings Section */}
      <section>
        <SectionHeading icon={Package} title={t("listings")} count={listings.length} />
        {listings.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorited={favoriteIds.has(listing.id)}
                isAuthenticated={isAuthenticated}
                showFavoriteButton={true}
                status={listing.status}
                showAvailabilityToggle={isOwnProfile}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <Package className="mx-auto size-10 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-500">
              {t("noListings")}
            </p>
          </div>
        )}
      </section>

      {/* Reviews Section */}
      <section>
        <SectionHeading icon={Star} title={t("reviews")} count={reviews.length} />
        {reviews.length > 0 ? (
          <div className="mt-2 divide-y">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <Star className="mx-auto size-10 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-500">
              {t("noReviews")}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {t("noReviewsHint")}
            </p>
          </div>
        )}
      </section>

      {/* About Section */}
      <section>
        <SectionHeading icon={UserCircle} title={t("about")} />
        <div className="mt-4">
          {user.bio ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {user.bio}
            </p>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <UserCircle className="mx-auto size-10 text-gray-300" />
              <p className="mt-2 text-sm font-medium text-gray-500">
                {isOwnProfile
                  ? t("noBioSelf")
                  : t("noBioOther")}
              </p>
              {isOwnProfile && (
                <p className="mt-1 text-xs text-gray-400">
                  {t("addBioHint")}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
