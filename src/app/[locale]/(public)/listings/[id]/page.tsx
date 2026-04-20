import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import {
  AlertTriangle,
  Star,
  Pencil,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { getListingById, getCachedTranslation } from "@/features/listings/queries";
import { getSession } from "@/features/auth/queries";
import { getReviewsForListing } from "@/features/reviews/queries";
import { getBookedDates, getExistingRentalForListing } from "@/features/rentals/queries";
import { getBlockedDatesForListing } from "@/features/availability/queries";
import { getUserFavoriteIds } from "@/features/favorites/queries";
import { isAIEnabled } from "@/lib/openai";
import { prisma } from "@/lib/db";
import { PriceDisplay } from "@/components/listings/price-display";
import { RentalRequestForm } from "@/components/rentals/rental-request-form";
import { MessageOwnerButton } from "@/components/messages/message-owner-button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ShareButton } from "@/components/listings/share-button";
import { SimilarListings } from "@/components/listings/similar-listings";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/profile/verification-badge";
import { ReputationBadges } from "@/components/profile/reputation-badge";
import { getUserBadges } from "@/features/badges/queries";
import { TrackListingView } from "@/components/analytics/track-event";

const CONDITION_KEYS: Record<string, string> = {
  new: "new",
  like_new: "likeNew",
  good: "good",
  fair: "fair",
  poor: "poor",
};

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-stone-500">
      {children}
    </div>
  );
}

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

export default async function ListingDetailPage({ params }: PageProps) {
  const { id, locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [listing, session, listingReviews, bookedDatesRaw, blockedDatesRaw, t, ta, tc] = await Promise.all([
    getListingById(id),
    getSession(),
    getReviewsForListing(id),
    getBookedDates(id),
    getBlockedDatesForListing(id),
    getTranslations("Listings.detail"),
    getTranslations("Listings.availability"),
    getTranslations("Conditions"),
  ]);

  const existingRentalRaw = session
    ? await getExistingRentalForListing(id, session.user.id)
    : null;

  const bookedDates = bookedDatesRaw.map((bd) => ({
    startDate: bd.startDate.toISOString(),
    endDate: bd.endDate.toISOString(),
    status: bd.status,
  }));

  const blockedDates = blockedDatesRaw.map((bd) => ({
    startDate: bd.startDate.toISOString(),
    endDate: bd.endDate.toISOString(),
  }));

  const existingRental = existingRentalRaw
    ? {
        id: existingRentalRaw.id,
        status: existingRentalRaw.status,
        startDate: existingRentalRaw.startDate.toISOString(),
        endDate: existingRentalRaw.endDate.toISOString(),
        totalPrice: existingRentalRaw.totalPrice,
        createdAt: existingRentalRaw.createdAt.toISOString(),
      }
    : null;

  if (!listing || listing.status === "hidden") {
    notFound();
  }

  const isOwner = session?.user?.id === listing.ownerId;
  const isRejected = listing.status === "rejected";
  const isUnderReview = listing.status === "under_review";
  const isUnavailable = listing.status === "unavailable";

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

  if (isRejected && !isOwner) {
    notFound();
  }

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
      return (
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <AlertTriangle className="mx-auto size-8 text-stone-400" />
          <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-stone-900 sm:text-4xl">
            {listing.title}
          </h1>
          <p className="mt-3 text-[15px] text-stone-500">{ta("unavailableBanner")}</p>
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/browse">{t("requestRental")}</Link>
            </Button>
          </div>
        </div>
      );
    }
  }

  let rejectionReason: string | null = null;
  if (isRejected && listing.moderationResult) {
    try {
      const modResult = JSON.parse(listing.moderationResult as string);
      rejectionReason = modResult.rejectionReason || modResult.reason || null;
    } catch {
      // ignore
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const shareUrl = `${baseUrl}/${locale}/listings/${listing.id}`;
  const shareText = listing.priceDaily
    ? `$${listing.priceDaily}/day - ${listing.description.slice(0, 100)}`
    : listing.description.slice(0, 100);

  const hideRentalForm = isUnavailable && !isOwner;

  const displayTitle = cachedTranslation?.translatedTitle ?? listing.title;
  const displayDescription = cachedTranslation?.translatedDescription ?? listing.description;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {!isOwner && <TrackListingView listingId={listing.id} />}

      {/* Banners */}
      {isRejected && isOwner && (
        <div className="mb-6 border-l-2 border-stone-900 bg-stone-100/80 px-4 py-3 text-[14px] text-stone-800">
          <div className="flex items-center gap-2 font-medium">
            <XCircle className="size-4 shrink-0" />
            {t("rejected")}
          </div>
          {rejectionReason && (
            <p className="mt-1 ml-6 text-stone-600">
              {t("rejectionReason", { reason: rejectionReason })}
            </p>
          )}
        </div>
      )}

      {isUnderReview && (
        <div className="mb-6 flex items-center gap-2 border-l-2 border-stone-900 bg-stone-100/80 px-4 py-3 text-[14px] text-stone-800">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="font-medium">{t("underReview")}</span>
        </div>
      )}

      {isUnavailable && (
        <div className="mb-6 flex items-center gap-2 border-l-2 border-stone-900 bg-stone-100/80 px-4 py-3 text-[14px] text-stone-800">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="font-medium">{ta("unavailableBanner")}</span>
        </div>
      )}

      {/* Top: photo + facts */}
      <div className="grid gap-8 md:grid-cols-5">
        {/* Main photo */}
        <div className="md:col-span-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2px] bg-stone-100">
            {sortedImages[0] ? (
              <Image
                src={sortedImages[0].url}
                alt={displayTitle}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[14px] text-stone-400">
                {t("noPhotos")}
              </div>
            )}
          </div>
        </div>

        {/* Facts column */}
        <div className="md:col-span-2">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-stone-900 sm:text-[32px]">
            {displayTitle}
          </h1>

          <div className="mt-6">
            <PriceDisplay
              priceHourly={listing.priceHourly}
              priceDaily={listing.priceDaily}
              priceWeekly={listing.priceWeekly}
              priceMonthly={listing.priceMonthly}
            />
          </div>

          <div className="mt-6">
            {isOwner ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/listings/${listing.id}/edit`}>
                  <Pencil className="mr-2 size-4" />
                  {t("editListing")}
                </Link>
              </Button>
            ) : hideRentalForm ? (
              <p className="text-[13px] text-stone-500">{t("notChargedYet")}</p>
            ) : (
              <div className="space-y-3">
                <RentalRequestForm
                  listingId={listing.id}
                  priceHourly={listing.priceHourly}
                  priceDaily={listing.priceDaily}
                  priceWeekly={listing.priceWeekly}
                  priceMonthly={listing.priceMonthly}
                  bookedDates={bookedDates}
                  blockedDates={blockedDates}
                  existingRental={existingRental}
                />
                <MessageOwnerButton listingId={listing.id} />
              </div>
            )}
          </div>

          <dl className="mt-8 space-y-2 border-t border-stone-200 pt-6 text-[14px]">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">{t("category")}</dt>
              <dd className="text-stone-800">{listing.category.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">{t("condition")}</dt>
              <dd className="text-stone-800">
                {tc(CONDITION_KEYS[listing.condition] as Parameters<typeof tc>[0]) || listing.condition}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">{t("location")}</dt>
              <dd className="text-stone-800">{listing.location}</dd>
            </div>
            {listing.aiVerified && (
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">{t("verified")}</dt>
                <dd className="inline-flex items-center gap-1 text-stone-800">
                  <ShieldCheck className="size-3.5" />
                  {t("aiVerified")}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-6 flex items-center gap-2 text-stone-500">
            <FavoriteButton
              listingId={listing.id}
              isFavorited={isFavorited}
              isAuthenticated={!!session}
              className="text-stone-500 hover:text-red-500"
            />
            <ShareButton
              title={displayTitle}
              text={shareText}
              url={shareUrl}
            />
          </div>

          <div className="mt-6 border-t border-stone-200 pt-6">
            <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-stone-500">
              {t("listedBy")}
            </div>
            <div className="mt-3 flex items-start gap-3">
              <div className="relative size-10 overflow-hidden rounded-full bg-stone-200 shrink-0">
                {listing.owner.image ? (
                  <Image
                    src={listing.owner.image}
                    alt={listing.owner.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[14px] font-medium text-stone-500">
                    {listing.owner.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/profiles/${listing.owner.id}`}
                    className="truncate text-[14px] font-medium text-stone-900 hover:underline underline-offset-4"
                  >
                    {listing.owner.name}
                  </Link>
                  {listing.owner.idVerified && <VerificationBadge />}
                </div>
                <div className="mt-0.5 text-[12px] text-stone-500">
                  {t("memberSince", { date: memberSince })}
                </div>
                {listing.owner.reviewCount > 0 && (
                  <div className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-stone-500">
                    <Star className="size-3 fill-stone-700 text-stone-700" />
                    {listing.owner.averageRating.toFixed(1)} ({listing.owner.reviewCount}{" "}
                    {listing.owner.reviewCount === 1 ? "review" : "reviews"})
                  </div>
                )}
                {ownerBadges.length > 0 && (
                  <div className="mt-1.5">
                    <ReputationBadges badges={ownerBadges} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {sortedImages.length > 1 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sortedImages.slice(1, 5).map((img) => (
            <div key={img.id} className="relative aspect-[4/3] overflow-hidden rounded-[2px] bg-stone-100">
              <Image
                src={img.url}
                alt={displayTitle}
                fill
                sizes="(max-width: 768px) 50vw, 280px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Description */}
      <div className="mt-10 max-w-3xl border-t border-stone-200 pt-7">
        <SectionKicker>{t("description")}</SectionKicker>
        <p className="mt-4 whitespace-pre-line text-[17px] leading-relaxed text-stone-700 sm:text-[18px]">
          {displayDescription}
        </p>
        {tags.length > 0 && (
          <p className="mt-6 text-[13px] text-stone-500">
            {tags.map((tag) => `#${tag}`).join("  ·  ")}
          </p>
        )}
      </div>

      {/* Reviews */}
      {listingReviews.length > 0 && (
        <div className="mt-10 max-w-3xl border-t border-stone-200 pt-7">
          <div className="flex items-baseline gap-3">
            <SectionKicker>{t("ownerReviews")}</SectionKicker>
            <span className="text-[12px] text-stone-400">{listingReviews.length}</span>
          </div>
          <div className="mt-5 space-y-6">
            {listingReviews.slice(0, 5).map((review) => (
              <figure key={review.id}>
                <blockquote className="font-serif text-[17px] leading-relaxed text-stone-900 sm:text-[18px]">
                  &ldquo;{review.comment}&rdquo;
                </blockquote>
                <figcaption className="mt-2 text-[12px] text-stone-500">
                  — {review.reviewer?.name ?? "Anonymous"},{" "}
                  {new Date(review.createdAt).toLocaleDateString(locale, { month: "long", year: "numeric" })}
                </figcaption>
              </figure>
            ))}
            {listingReviews.length > 5 && (
              <p className="text-[13px] text-stone-500">+ {listingReviews.length - 5} more reviews</p>
            )}
          </div>
        </div>
      )}

      {/* Similar listings */}
      <div className="mt-12">
        <SimilarListings
          listingId={listing.id}
          categoryId={listing.categoryId}
          favoriteIds={favoriteIds}
          isAuthenticated={!!session}
        />
      </div>
    </div>
  );
}
