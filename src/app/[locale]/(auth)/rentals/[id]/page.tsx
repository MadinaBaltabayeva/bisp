import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays, DollarSign, MessageSquare, Shield } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

import { getSession } from "@/features/auth/queries";
import { getRentalWithEvents } from "@/features/rentals/queries";
import { hasReviewed } from "@/features/reviews/queries";
import { RentalTimeline } from "@/components/rentals/rental-timeline";
import { RentalDetailActions } from "@/components/rentals/rental-detail-actions";
import { RentalStatusBadge } from "@/components/rentals/rental-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  const t = await getTranslations({ locale, namespace: "Rentals.detail" });
  return {
    title: `${t("title")} - RentHub`,
  };
}

export default async function RentalDetailPage({ params }: PageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [session, t, tRentals] = await Promise.all([
    getSession(),
    getTranslations("Rentals.detail"),
    getTranslations("Rentals"),
  ]);

  if (!session) return null;

  const rental = await getRentalWithEvents(id);

  if (!rental) {
    notFound();
  }

  // Only renter or owner can view
  const isRenter = session.user.id === rental.renterId;
  const isOwner = session.user.id === rental.ownerId;
  if (!isRenter && !isOwner) {
    notFound();
  }

  const role: "renter" | "owner" = isRenter ? "renter" : "owner";
  const otherParty = role === "owner" ? rental.renter : rental.owner;
  const revieweeId = role === "renter" ? (rental.owner?.id ?? "") : (rental.renter?.id ?? "");
  const revieweeName = role === "renter" ? (rental.owner?.name ?? "User") : (rental.renter?.name ?? "User");

  const reviewed = rental.status === "completed"
    ? await hasReviewed(rental.id, session.user.id)
    : false;

  const coverImage = rental.listing.images[0]?.url;
  const startDate = new Date(rental.startDate);
  const endDate = new Date(rental.endDate);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <RentalStatusBadge status={rental.status} />
      </div>

      {/* Listing info card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Thumbnail */}
            <Link
              href={`/listings/${rental.listing.id}`}
              className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted"
            >
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={rental.listing.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  {tRentals("card.noImage" as Parameters<typeof tRentals>[0])}
                </div>
              )}
            </Link>

            {/* Listing details */}
            <div className="min-w-0 flex-1">
              <Link
                href={`/listings/${rental.listing.id}`}
                className="font-semibold text-foreground hover:underline"
              >
                {rental.listing.title}
              </Link>
              {rental.listing.category && (
                <p className="text-xs text-muted-foreground">
                  {rental.listing.category.name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rental details grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Renter / Owner */}
        {otherParty && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                {otherParty.image ? (
                  <Image
                    src={otherParty.image}
                    alt={otherParty.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium">
                    {otherParty.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {role === "owner" ? t("renter") : t("owner")}
                </p>
                <p className="text-sm font-medium">{otherParty.name}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dates */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarDays className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("dates")}</p>
              <p className="text-sm font-medium">
                {startDate.toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                })}
                {" - "}
                {endDate.toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Price */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("price")}</p>
              <p className="text-sm font-medium">
                ${rental.totalPrice.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Deposit */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Shield className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("deposit")}</p>
              <p className="text-sm font-medium">
                ${rental.securityDeposit.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message */}
      {rental.message && (
        <Card className="mb-6">
          <CardContent className="flex items-start gap-3 p-4">
            <MessageSquare className="mt-0.5 size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("message")}</p>
              <p className="text-sm italic text-foreground">
                &ldquo;{rental.message}&rdquo;
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("timeline")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RentalTimeline
            events={rental.events}
            currentStatus={rental.status}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      {(role === "owner" ||
        (rental.status === "completed" && !reviewed)) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("actions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RentalDetailActions
              rentalId={rental.id}
              status={rental.status}
              role={role}
              hasReviewedByUser={reviewed}
              revieweeId={revieweeId}
              revieweeName={revieweeName}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
