import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Package, Star, UserCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Separator } from "@/components/ui/separator";
import { ReviewCard } from "@/components/reviews/review-card";

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
  priceDaily: number | null;
  images: { url: string }[];
  category: { name: string };
}

interface ProfileSectionsProps {
  user: {
    bio: string;
  };
  isOwnProfile: boolean;
  reviews?: ReviewData[];
  listings?: ListingData[];
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
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {listing.images[0]?.url ? (
                    <Image
                      src={listing.images[0].url}
                      alt={listing.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Package className="size-8" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="truncate text-sm font-medium">{listing.title}</p>
                  <div className="flex items-center justify-between">
                    {listing.priceDaily && (
                      <p className="text-xs font-medium text-primary-600">
                        ${listing.priceDaily}/day
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {listing.category.name}
                    </p>
                  </div>
                </div>
              </Link>
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
