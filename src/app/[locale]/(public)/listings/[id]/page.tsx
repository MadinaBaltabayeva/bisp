import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import {
  MapPin,
  ShieldCheck,
  Tag,
  AlertTriangle,
  Calendar,
  Star,
  Pencil,
  XCircle,
} from "lucide-react";

import { getListingById, getCachedTranslation } from "@/features/listings/queries";
import { getSession } from "@/features/auth/queries";
import { getReviewsForListing } from "@/features/reviews/queries";
import { getBookedDates } from "@/features/rentals/queries";
import { getUserFavoriteIds } from "@/features/favorites/queries";
import { isAIEnabled } from "@/lib/openai";
import { prisma } from "@/lib/db";
import { TranslationBanner } from "@/components/listings/translation-banner";
import { ReviewCard } from "@/components/reviews/review-card";
import { PhotoCarousel } from "@/components/listings/photo-carousel";
import { PriceDisplay } from "@/components/listings/price-display";
import { RentalRequestForm } from "@/components/rentals/rental-request-form";
import { MessageOwnerButton } from "@/components/messages/message-owner-button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ShareButton } from "@/components/listings/share-button";
import { SimilarListings } from "@/components/listings/similar-listings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/profile/verification-badge";
import { ReputationBadges } from "@/components/profile/reputation-badge";
import { getUserBadges } from "@/features/badges/queries";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id, locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  const [listing, t] = await Promise.all([
    getListingById(id),
    getTranslations({ locale, namespace: "Metadata" }),
  ]);

  if (!listing) {
    const td = await getTranslations({ locale, namespace: "Listings.detail" });
    return { title: td("notFound") };
  }

  return {
    title: t("listingDetail.title", { title: listing.title }),
    description: t("listingDetail.description", { title: listing.title }),
  };
}

const CONDITION_KEYS: Record<string, string> = {
  new: "new",
  like_new: "likeNew",
  good: "good",
  fair: "fair",
  poor: "poor",
};

export default async function ListingDetailPage({ params }: PageProps) {
  const { id, locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [listing, session, listingReviews, bookedDatesRaw, t, tc, ta] = await Promise.all([
    getListingById(id),
    getSession(),
    getReviewsForListing(id),
    getBookedDates(id),
    getTranslations("Listings.detail"),
    getTranslations("Conditions"),
    getTranslations("Listings.availability"),
  ]);

  // Serialize dates for client components (Date objects can't be passed to "use client")
  const bookedDates = bookedDatesRaw.map((bd) => ({
    startDate: bd.startDate.toISOString(),
    endDate: bd.endDate.toISOString(),
    status: bd.status,
  }));

  if (!listing || listing.status === "hidden") {
    notFound();
  }

  const isOwner = session?.user?.id === listing.ownerId;
  const isRejected = listing.status === "rejected";
  const isUnderReview = listing.status === "under_review";
  const isUnavailable = listing.status === "unavailable";

  // Fetch favorite IDs and owner badges in parallel
  const [favoriteIds, ownerBadges] = await Promise.all([
    session ? getUserFavoriteIds(session.user.id) : Promise.resolve(new Set<string>()),
    getUserBadges(listing.ownerId),
  ]);
  const isFavorited = favoriteIds.has(listing.id);

  const aiEnabled = isAIEnabled();
  let cachedTranslation = null;
  if (aiEnabled) {
    cachedTranslation = await getCachedTranslation(listing.id, locale);
  }

  // Non-owners should not see rejected listings
  if (isRejected && !isOwner) {
    notFound();
  }

  // Unavailable listing handling: show to owner and rental participants, show banner to others
  if (isUnavailable) {
    const hasActiveRental = session
      ? await prisma.rental.findFirst({
          where: {
            listingId: listing.id,
            OR: [
              { renterId: session.user.id },
              { ownerId: session.user.id },
            ],
            status: {
              in: ["requested", "approved", "active", "returned"],
            },
          },
        })
      : null;
    const canViewUnavailable = isOwner || !!hasActiveRental;

    if (!canViewUnavailable) {
      // Show a soft "unavailable" page (not 404)
      return (
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md text-center">
            <Card>
              <CardContent className="py-12">
                <AlertTriangle className="mx-auto size-12 text-yellow-500" />
                <h1 className="mt-4 text-xl font-semibold text-gray-900">
                  {listing.title}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {ta("unavailableBanner")}
                </p>
                <Button asChild className="mt-6" variant="outline">
                  <Link href="/browse">{t("requestRental")}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
  }

  // Parse rejection reason from moderationResult JSON
  let rejectionReason: string | null = null;
  if (isRejected && listing.moderationResult) {
    try {
      const modResult = JSON.parse(listing.moderationResult as string);
      rejectionReason = modResult.rejectionReason || modResult.reason || null;
    } catch {
      // ignore parse errors
    }
  }
  const tags = listing.tags
    ? listing.tags
        .split(",")
        .map((tg) => tg.trim())
        .filter(Boolean)
    : [];

  const sortedImages = [...listing.images].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  const memberSince = new Date(listing.owner.createdAt).toLocaleDateString(
    locale,
    { month: "long", year: "numeric" }
  );

  // Construct share URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const shareUrl = `${baseUrl}/${locale}/listings/${listing.id}`;
  const shareText = listing.priceDaily
    ? `$${listing.priceDaily}/day - ${listing.description.slice(0, 100)}`
    : listing.description.slice(0, 100);

  // Whether to hide the rental request form (unavailable listing viewed by participant)
  const hideRentalForm = isUnavailable && !isOwner;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Rejected banner (owner only) */}
      {isRejected && isOwner && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <XCircle className="size-4 shrink-0" />
            {t("rejected")}
          </div>
          {rejectionReason && (
            <p className="mt-1 ml-6 text-red-700">
              {t("rejectionReason", { reason: rejectionReason })}
            </p>
          )}
        </div>
      )}

      {/* Under review banner */}
      {isUnderReview && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <AlertTriangle className="size-4 shrink-0" />
          {t("underReview")}
        </div>
      )}

      {/* Unavailable banner (for owner/participants who can still view) */}
      {isUnavailable && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <AlertTriangle className="size-4 shrink-0" />
          {ta("unavailableBanner")}
        </div>
      )}

      {/* Split layout: left content + right sticky price card */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* === Left column (desktop) / Top (mobile) === */}
        <div className="lg:col-span-3">
          {/* Photo carousel */}
          <PhotoCarousel
            images={sortedImages.map((img) => ({
              id: img.id,
              url: img.url,
            }))}
            title={listing.title}
          />

          {/* Title + Favorite + Share buttons */}
          {aiEnabled ? (
            <TranslationBanner
              listingId={listing.id}
              locale={locale}
              originalTitle={listing.title}
              originalDescription={listing.description}
              descriptionHeading={t("description")}
              cachedTranslation={cachedTranslation}
              aiEnabled={aiEnabled}
            >
              {/* Action buttons row */}
              <div className="mt-3 flex items-center gap-2">
                <div className="rounded-full bg-gray-100">
                  <FavoriteButton
                    listingId={listing.id}
                    isFavorited={isFavorited}
                    isAuthenticated={!!session}
                    className="text-gray-600 hover:text-red-500"
                  />
                </div>
                <ShareButton
                  title={listing.title}
                  text={shareText}
                  url={shareUrl}
                />
              </div>
              {/* Badges row */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{listing.category.name}</Badge>
                <Badge variant="outline">
                  {tc(CONDITION_KEYS[listing.condition] as Parameters<typeof tc>[0]) || listing.condition}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {listing.location}
                </div>
                {listing.aiVerified && (
                  <Badge className="bg-green-600 text-white hover:bg-green-700">
                    <ShieldCheck className="size-3" />
                    {t("aiVerified")}
                  </Badge>
                )}
              </div>
              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      <Tag className="size-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {/* Mobile price card */}
              <div className="mt-6 lg:hidden">
                <PriceCard listing={listing} isOwner={isOwner} hideRentalForm={hideRentalForm} bookedDates={bookedDates} />
              </div>
            </TranslationBanner>
          ) : (
            <>
              {/* Title */}
              <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl">
                {listing.title}
              </h1>
              {/* Action buttons row */}
              <div className="mt-3 flex items-center gap-2">
                <div className="rounded-full bg-gray-100">
                  <FavoriteButton
                    listingId={listing.id}
                    isFavorited={isFavorited}
                    isAuthenticated={!!session}
                    className="text-gray-600 hover:text-red-500"
                  />
                </div>
                <ShareButton
                  title={listing.title}
                  text={shareText}
                  url={shareUrl}
                />
              </div>
              {/* Badges row */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{listing.category.name}</Badge>
                <Badge variant="outline">
                  {tc(CONDITION_KEYS[listing.condition] as Parameters<typeof tc>[0]) || listing.condition}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {listing.location}
                </div>
                {listing.aiVerified && (
                  <Badge className="bg-green-600 text-white hover:bg-green-700">
                    <ShieldCheck className="size-3" />
                    {t("aiVerified")}
                  </Badge>
                )}
              </div>
              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      <Tag className="size-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {/* Mobile price card */}
              <div className="mt-6 lg:hidden">
                <PriceCard listing={listing} isOwner={isOwner} hideRentalForm={hideRentalForm} bookedDates={bookedDates} />
              </div>
              {/* Description */}
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t("description")}
                </h2>
                <p className="mt-2 whitespace-pre-line text-gray-600 leading-relaxed">
                  {listing.description}
                </p>
              </div>
            </>
          )}

          {/* Owner section */}
          <div className="mt-8 border-t pt-8">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("listedBy")}
            </h2>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative size-12 overflow-hidden rounded-full bg-gray-200">
                {listing.owner.image ? (
                  <Image
                    src={listing.owner.image}
                    alt={listing.owner.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-medium text-gray-500">
                    {listing.owner.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/profiles/${listing.owner.id}`}
                    className="font-medium text-gray-900 hover:text-primary transition-colors hover:underline"
                  >
                    {listing.owner.name}
                  </Link>
                  {listing.owner.idVerified && <VerificationBadge />}
                </div>
                {ownerBadges.length > 0 && (
                  <div className="mt-1">
                    <ReputationBadges badges={ownerBadges} />
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {t("memberSince", { date: memberSince })}
                  </span>
                  {listing.owner.reviewCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                      {listing.owner.averageRating.toFixed(1)} ({listing.owner.reviewCount}{" "}
                      {listing.owner.reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Owner Reviews section */}
          <div className="mt-8 border-t pt-8">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("ownerReviews")}
              {listingReviews.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({listingReviews.length})
                </span>
              )}
            </h2>
            {listingReviews.length > 0 ? (
              <div className="mt-2 divide-y">
                {listingReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                {t("noReviews")}
              </p>
            )}
          </div>

          {/* Similar listings section */}
          <SimilarListings
            listingId={listing.id}
            categoryId={listing.categoryId}
            favoriteIds={favoriteIds}
            isAuthenticated={!!session}
          />
        </div>

        {/* === Right column (desktop only) - sticky price card === */}
        <div className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24">
            <PriceCard
              listing={listing}
              isOwner={isOwner}
              hideRentalForm={hideRentalForm}
              bookedDates={bookedDates}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Price card sub-component ---- */

async function PriceCard({
  listing,
  isOwner,
  hideRentalForm = false,
  bookedDates,
}: {
  listing: {
    id: string;
    priceHourly: number | null;
    priceDaily: number | null;
    priceWeekly: number | null;
    priceMonthly: number | null;
  };
  isOwner: boolean;
  hideRentalForm?: boolean;
  bookedDates: { startDate: string; endDate: string; status: string }[];
}) {
  const t = await getTranslations("Listings.detail");

  return (
    <Card>
      <CardHeader>
        <PriceDisplay
          priceHourly={listing.priceHourly}
          priceDaily={listing.priceDaily}
          priceWeekly={listing.priceWeekly}
          priceMonthly={listing.priceMonthly}
        />
      </CardHeader>
      <CardContent>
        {isOwner ? (
          <Button asChild className="w-full" size="lg">
            <Link href={`/listings/${listing.id}/edit`}>
              <Pencil className="mr-2 size-4" />
              {t("editListing")}
            </Link>
          </Button>
        ) : hideRentalForm ? (
          <p className="text-center text-sm text-muted-foreground">
            {t("notChargedYet")}
          </p>
        ) : (
          <div className="space-y-3">
            <RentalRequestForm
              listingId={listing.id}
              priceHourly={listing.priceHourly}
              priceDaily={listing.priceDaily}
              priceWeekly={listing.priceWeekly}
              priceMonthly={listing.priceMonthly}
              bookedDates={bookedDates}
            />
            <MessageOwnerButton listingId={listing.id} />
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-xs text-muted-foreground">
          {isOwner
            ? t("youOwnThis")
            : t("notChargedYet")}
        </p>
      </CardFooter>
    </Card>
  );
}
