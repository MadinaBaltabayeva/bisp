import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
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

import { getListingById } from "@/features/listings/queries";
import { getSession } from "@/features/auth/queries";
import { getReviewsForListing } from "@/features/reviews/queries";
import { ReviewCard } from "@/components/reviews/review-card";
import { PhotoCarousel } from "@/components/listings/photo-carousel";
import { PriceDisplay } from "@/components/listings/price-display";
import { RentalRequestForm } from "@/components/rentals/rental-request-form";
import { MessageOwnerButton } from "@/components/messages/message-owner-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/profile/verification-badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    return { title: "Listing Not Found" };
  }

  return {
    title: listing.title,
    description: listing.description.slice(0, 160),
  };
}

const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [listing, session, listingReviews] = await Promise.all([
    getListingById(id),
    getSession(),
    getReviewsForListing(id),
  ]);

  if (!listing || listing.status === "hidden") {
    notFound();
  }

  const isOwner = session?.user?.id === listing.ownerId;
  const isRejected = listing.status === "rejected";
  const isUnderReview = listing.status === "under_review";

  // Non-owners should not see rejected listings
  if (isRejected && !isOwner) {
    notFound();
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
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const sortedImages = [...listing.images].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  const memberSince = new Date(listing.owner.createdAt).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Rejected banner (owner only) */}
      {isRejected && isOwner && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <XCircle className="size-4 shrink-0" />
            This listing has been rejected
          </div>
          {rejectionReason && (
            <p className="mt-1 ml-6 text-red-700">
              Reason: {rejectionReason}
            </p>
          )}
        </div>
      )}

      {/* Under review banner */}
      {isUnderReview && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <AlertTriangle className="size-4 shrink-0" />
          This listing is currently under review
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

          {/* Title */}
          <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl">
            {listing.title}
          </h1>

          {/* Badges row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{listing.category.name}</Badge>
            <Badge variant="outline">
              {CONDITION_LABELS[listing.condition] || listing.condition}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {listing.location}
            </div>
            {listing.aiVerified && (
              <Badge className="bg-green-600 text-white hover:bg-green-700">
                <ShieldCheck className="size-3" />
                AI Verified
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
            <PriceCard
              listing={listing}
              isOwner={isOwner}
            />
          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Description
            </h2>
            <p className="mt-2 whitespace-pre-line text-gray-600 leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* Owner section */}
          <div className="mt-8 border-t pt-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Listed by
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
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    Member since {memberSince}
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
              Owner Reviews
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
                No reviews yet
              </p>
            )}
          </div>
        </div>

        {/* === Right column (desktop only) - sticky price card === */}
        <div className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24">
            <PriceCard
              listing={listing}
              isOwner={isOwner}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Price card sub-component ---- */

function PriceCard({
  listing,
  isOwner,
}: {
  listing: {
    id: string;
    priceHourly: number | null;
    priceDaily: number | null;
    priceWeekly: number | null;
    priceMonthly: number | null;
  };
  isOwner: boolean;
}) {
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
              Edit Listing
            </Link>
          </Button>
        ) : (
          <div className="space-y-3">
            <RentalRequestForm
              listingId={listing.id}
              priceDaily={listing.priceDaily}
              priceWeekly={listing.priceWeekly}
            />
            <MessageOwnerButton listingId={listing.id} />
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-xs text-muted-foreground">
          {isOwner
            ? "You own this listing"
            : "You won't be charged yet"}
        </p>
      </CardFooter>
    </Card>
  );
}
