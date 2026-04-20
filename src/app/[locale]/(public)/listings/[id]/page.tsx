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
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md text-center">
            <div className="rounded-md border border-stone-200 bg-white px-8 py-12">
              <AlertTriangle className="mx-auto size-10 text-stone-400" />
              <h1 className="mt-4 text-xl font-medium text-stone-900">
                {listing.title}
              </h1>
              <p className="mt-2 text-[14px] text-stone-500">
                {ta("unavailableBanner")}
              </p>
              <Button asChild className="mt-6" variant="outline">
                <Link href="/browse">{t("requestRental")}</Link>
              </Button>
            </div>
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const shareUrl = `${baseUrl}/${locale}/listings/${listing.id}`;
  const shareText = listing.priceDaily
    ? `$${listing.priceDaily}/day - ${listing.description.slice(0, 100)}`
    : listing.description.slice(0, 100);

  const hideRentalForm = isUnavailable && !isOwner;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {!isOwner && <TrackListingView listingId={listing.id} />}

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

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-[4px] bg-stone-100">
            <PhotoCarousel
              images={sortedImages.map((img) => ({ id: img.id, url: img.url }))}
              title={listing.title}
            />
          </div>

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
              <div className="mt-4 flex items-center gap-2 text-stone-500">
                <FavoriteButton
                  listingId={listing.id}
                  isFavorited={isFavorited}
                  isAuthenticated={!!session}
                  className="text-stone-500 hover:text-red-500"
                />
                <ShareButton
                  title={listing.title}
                  text={shareText}
                  url={shareUrl}
                />
              </div>
              {tags.length > 0 && (
                <p className="mt-6 text-[13px] text-stone-500">
                  {tags.map((tg) => `#${tg}`).join("  ·  ")}
                </p>
              )}
            </TranslationBanner>
          ) : (
            <>
              <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-stone-900 sm:text-[32px]">
                {listing.title}
              </h1>
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
              <div className="mt-4 flex items-center gap-2 text-stone-500">
                <FavoriteButton
                  listingId={listing.id}
                  isFavorited={isFavorited}
                  isAuthenticated={!!session}
                  className="text-stone-500 hover:text-red-500"
                />
                <ShareButton
                  title={listing.title}
                  text={shareText}
                  url={shareUrl}
                />
              </div>
              <section className="mt-8">
                <SectionKicker>{t("description")}</SectionKicker>
                <p className="mt-4 whitespace-pre-line text-[16px] leading-relaxed text-stone-700">
                  {listing.description}
                </p>
                {tags.length > 0 && (
                  <p className="mt-6 text-[13px] text-stone-500">
                    {tags.map((tg) => `#${tg}`).join("  ·  ")}
                  </p>
                )}
              </section>
            </>
          )}

          {listingReviews.length > 0 && (
            <section className="mt-10 border-t border-stone-200 pt-7">
              <div className="flex items-baseline gap-3">
                <SectionKicker>{t("ownerReviews")}</SectionKicker>
                <span className="text-[12px] text-stone-400">{listingReviews.length}</span>
              </div>
              <div className="mt-5 divide-y divide-stone-200">
                {listingReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="mt-8 lg:col-span-2 lg:mt-0">
          <div className="lg:sticky lg:top-24">
            <PriceCard
              listing={listing}
              isOwner={isOwner}
              hideRentalForm={hideRentalForm}
              bookedDates={bookedDates}
              blockedDates={blockedDates}
              existingRental={existingRental}
              owner={{
                id: listing.owner.id,
                name: listing.owner.name,
                image: listing.owner.image,
                idVerified: listing.owner.idVerified,
                averageRating: listing.owner.averageRating,
                reviewCount: listing.owner.reviewCount,
                memberSince,
              }}
              ownerBadges={ownerBadges}
            />
          </div>
        </aside>
      </div>

      <div className="mt-14">
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

async function PriceCard({
  listing,
  isOwner,
  hideRentalForm = false,
  bookedDates,
  blockedDates,
  existingRental,
  owner,
  ownerBadges,
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
  owner: {
    id: string;
    name: string;
    image: string | null;
    idVerified: boolean;
    averageRating: number;
    reviewCount: number;
    memberSince: string;
  };
  ownerBadges: Parameters<typeof ReputationBadges>[0]["badges"] | undefined;
}) {
  const t = await getTranslations("Listings.detail");

  return (
    <div className="rounded-md border border-stone-200 bg-white">
      <div className="p-6">
        <PriceDisplay
          priceHourly={listing.priceHourly}
          priceDaily={listing.priceDaily}
          priceWeekly={listing.priceWeekly}
          priceMonthly={listing.priceMonthly}
        />
        <div className="mt-5">
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
      </div>

      <Link
        href={`/profiles/${owner.id}`}
        className="group flex items-center gap-3 border-t border-stone-200 px-6 py-5"
      >
        <div className="relative size-10 overflow-hidden rounded-full bg-stone-200 shrink-0">
          {owner.image ? (
            <Image
              src={owner.image}
              alt={owner.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[14px] font-medium text-stone-500">
              {owner.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[14px] font-medium text-stone-900 group-hover:underline underline-offset-4">
              {owner.name}
            </span>
            {owner.idVerified && <VerificationBadge />}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-stone-500">
            {owner.reviewCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3 fill-stone-700 text-stone-700" />
                {owner.averageRating.toFixed(1)} ({owner.reviewCount})
              </span>
            )}
            {owner.reviewCount > 0 && <span aria-hidden>·</span>}
            <span className="truncate">{owner.memberSince}</span>
          </div>
        </div>
      </Link>

      {ownerBadges && ownerBadges.length > 0 && (
        <div className="border-t border-stone-200 px-6 py-4">
          <ReputationBadges badges={ownerBadges} />
        </div>
      )}
    </div>
  );
}
