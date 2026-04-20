import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import {
  ShieldCheck,
  AlertTriangle,
  Star,
  Pencil,
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
import { TranslationBanner } from "@/components/listings/translation-banner";
import { ReviewCard } from "@/components/reviews/review-card";
import { PhotoCarousel } from "@/components/listings/photo-carousel";
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

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-stone-500">
      {children}
    </div>
  );
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id, locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [listing, session, listingReviews, bookedDatesRaw, blockedDatesRaw, t, tc, ta] = await Promise.all([
    getListingById(id),
    getSession(),
    getReviewsForListing(id),
    getBookedDates(id),
    getBlockedDatesForListing(id),
    getTranslations("Listings.detail"),
    getTranslations("Conditions"),
    getTranslations("Listings.availability"),
  ]);

  // Fetch existing rental for the logged-in user on this listing
  const existingRentalRaw = session
    ? await getExistingRentalForListing(id, session.user.id)
    : null;

  // Serialize dates for client components (Date objects can't be passed to "use client")
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
            <AlertTriangle className="mx-auto size-10 text-stone-500" />
            <h1 className="mt-4 font-serif text-2xl font-medium tracking-tight text-stone-900">
              {listing.title}
            </h1>
            <p className="mt-2 text-[14px] text-stone-600">
              {ta("unavailableBanner")}
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link href="/browse">{t("requestRental")}</Link>
            </Button>
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
      {!isOwner && <TrackListingView listingId={listing.id} />}

      {/* Rejected banner (owner only) */}
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

      {/* Under review banner */}
      {isUnderReview && (
        <div className="mb-6 border-l-2 border-stone-900 bg-stone-100/80 px-4 py-3 text-[14px] text-stone-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4 shrink-0" />
            {t("underReview")}
          </div>
        </div>
      )}

      {/* Unavailable banner (for owner/participants who can still view) */}
      {isUnavailable && (
        <div className="mb-6 border-l-2 border-stone-900 bg-stone-100/80 px-4 py-3 text-[14px] text-stone-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4 shrink-0" />
            {ta("unavailableBanner")}
          </div>
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

          {/* Title + meta + actions */}
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
              <div className="mt-4 flex items-center gap-2">
                <FavoriteButton
                  listingId={listing.id}
                  isFavorited={isFavorited}
                  isAuthenticated={!!session}
                  className="text-stone-600 hover:text-red-500"
                />
                <ShareButton
                  title={listing.title}
                  text={shareText}
                  url={shareUrl}
                />
              </div>
              {/* Meta row */}
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-stone-500">
                <span>{listing.category.name}</span>
                <span aria-hidden>·</span>
                <span>{tc(CONDITION_KEYS[listing.condition] as Parameters<typeof tc>[0]) || listing.condition}</span>
                <span aria-hidden>·</span>
                <span>{listing.location}</span>
                {listing.aiVerified && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1 text-stone-700">
                      <ShieldCheck className="size-3.5" />
                      {t("aiVerified")}
                    </span>
                  </>
                )}
              </div>
              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-stone-500">
                  {tags.map((tag, i) => (
                    <span key={tag} className="inline-flex items-center">
                      {i > 0 && <span aria-hidden className="mr-3 text-stone-300">/</span>}
                      <span>#{tag}</span>
                    </span>
                  ))}
                </div>
              )}
              {/* Mobile price card */}
              <div className="mt-6 lg:hidden">
                <PriceCard listing={listing} isOwner={isOwner} hideRentalForm={hideRentalForm} bookedDates={bookedDates} blockedDates={blockedDates} existingRental={existingRental} />
              </div>
            </TranslationBanner>
          ) : (
            <>
              {/* Title */}
              <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-stone-900 sm:text-4xl">
                {listing.title}
              </h1>
              {/* Meta row */}
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-stone-500">
                <span>{listing.category.name}</span>
                <span aria-hidden>·</span>
                <span>{tc(CONDITION_KEYS[listing.condition] as Parameters<typeof tc>[0]) || listing.condition}</span>
                <span aria-hidden>·</span>
                <span>{listing.location}</span>
                {listing.aiVerified && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1 text-stone-700">
                      <ShieldCheck className="size-3.5" />
                      {t("aiVerified")}
                    </span>
                  </>
                )}
              </div>
              {/* Action buttons row */}
              <div className="mt-4 flex items-center gap-2">
                <FavoriteButton
                  listingId={listing.id}
                  isFavorited={isFavorited}
                  isAuthenticated={!!session}
                  className="text-stone-600 hover:text-red-500"
                />
                <ShareButton
                  title={listing.title}
                  text={shareText}
                  url={shareUrl}
                />
              </div>
              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-stone-500">
                  {tags.map((tag, i) => (
                    <span key={tag} className="inline-flex items-center">
                      {i > 0 && <span aria-hidden className="mr-3 text-stone-300">/</span>}
                      <span>#{tag}</span>
                    </span>
                  ))}
                </div>
              )}
              {/* Mobile price card */}
              <div className="mt-6 lg:hidden">
                <PriceCard listing={listing} isOwner={isOwner} hideRentalForm={hideRentalForm} bookedDates={bookedDates} blockedDates={blockedDates} existingRental={existingRental} />
              </div>
              {/* Description */}
              <div className="mt-10">
                <SectionKicker>{t("description")}</SectionKicker>
                <p className="mt-4 whitespace-pre-line text-[16px] leading-relaxed text-stone-700">
                  {listing.description}
                </p>
              </div>
            </>
          )}

          {/* Owner section */}
          <div className="mt-12 border-t border-stone-200 pt-10">
            <SectionKicker>{t("listedBy")}</SectionKicker>
            <div className="mt-5 flex items-center gap-4">
              <div className="relative size-12 overflow-hidden rounded-full bg-stone-200">
                {listing.owner.image ? (
                  <Image
                    src={listing.owner.image}
                    alt={listing.owner.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-medium text-stone-500">
                    {listing.owner.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/profiles/${listing.owner.id}`}
                    className="text-[16px] font-medium text-stone-900 hover:underline underline-offset-4"
                  >
                    {listing.owner.name}
                  </Link>
                  {listing.owner.idVerified && <VerificationBadge />}
                </div>
                {ownerBadges.length > 0 && (
                  <div className="mt-1.5">
                    <ReputationBadges badges={ownerBadges} />
                  </div>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-stone-500">
                  <span>{t("memberSince", { date: memberSince })}</span>
                  {listing.owner.reviewCount > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3 fill-stone-700 text-stone-700" />
                        {listing.owner.averageRating.toFixed(1)} ({listing.owner.reviewCount}{" "}
                        {listing.owner.reviewCount === 1 ? "review" : "reviews"})
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Owner Reviews section */}
          <div className="mt-12 border-t border-stone-200 pt-10">
            <div className="flex items-baseline gap-3">
              <SectionKicker>{t("ownerReviews")}</SectionKicker>
              {listingReviews.length > 0 && (
                <span className="text-[12px] text-stone-400">{listingReviews.length}</span>
              )}
            </div>
            {listingReviews.length > 0 ? (
              <div className="mt-6 divide-y divide-stone-200">
                {listingReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-[14px] text-stone-500">{t("noReviews")}</p>
            )}
          </div>

          {/* Similar listings section */}
          <div className="mt-16">
            <SimilarListings
              listingId={listing.id}
              categoryId={listing.categoryId}
              favoriteIds={favoriteIds}
              isAuthenticated={!!session}
            />
          </div>
        </div>

        {/* === Right column (desktop only) - sticky price card === */}
        <div className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24">
            <PriceCard
              listing={listing}
              isOwner={isOwner}
              hideRentalForm={hideRentalForm}
              bookedDates={bookedDates}
              blockedDates={blockedDates}
              existingRental={existingRental}
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
  blockedDates,
  existingRental,
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
  blockedDates: { startDate: string; endDate: string }[];
  existingRental: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    createdAt: string;
  } | null;
}) {
  const t = await getTranslations("Listings.detail");

  return (
    <div className="rounded-md border border-stone-200 bg-white">
      <div className="border-b border-stone-200 p-6">
        <PriceDisplay
          priceHourly={listing.priceHourly}
          priceDaily={listing.priceDaily}
          priceWeekly={listing.priceWeekly}
          priceMonthly={listing.priceMonthly}
        />
      </div>
      <div className="p-6">
        {isOwner ? (
          <Button asChild className="w-full" size="lg">
            <Link href={`/listings/${listing.id}/edit`}>
              <Pencil className="mr-2 size-4" />
              {t("editListing")}
            </Link>
          </Button>
        ) : hideRentalForm ? (
          <p className="text-center text-[13px] text-stone-500">
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
              blockedDates={blockedDates}
              existingRental={existingRental}
            />
            <MessageOwnerButton listingId={listing.id} />
          </div>
        )}
      </div>
      <div className="border-t border-stone-200 px-6 py-3 text-center text-[12px] text-stone-500">
        {isOwner ? t("youOwnThis") : t("notChargedYet")}
      </div>
    </div>
  );
}
