"use client";

import { useTransition } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Loader2, Check, X, RotateCcw, CheckCircle, CheckCheck, ChevronRight, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useTranslations, useFormatter } from "next-intl";

import {
  approveRental,
  declineRental,
  markReturned,
  completeRental,
} from "@/features/rentals/actions";
import { RentalStatusBadge } from "@/components/rentals/rental-status-badge";
import { ReviewForm } from "@/components/reviews/review-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RentalCardProps {
  rental: {
    id: string;
    startDate: Date;
    endDate: Date;
    status: string;
    message: string;
    totalPrice: number;
    securityDeposit: number;
    listing: {
      id: string;
      title: string;
      images: { url: string }[];
    };
    renter?: { id: string; name: string; image: string | null };
    owner?: { id: string; name: string; image: string | null };
  };
  role: "renter" | "owner";
  hasReviewedByUser?: boolean;
}

export function RentalCard({ rental, role, hasReviewedByUser }: RentalCardProps) {
  const t = useTranslations("Rentals");
  const [isPending, startTransition] = useTransition();
  const format = useFormatter();

  const otherParty = role === "owner" ? rental.renter : rental.owner;
  const coverImage = rental.listing.images[0]?.url;

  function handleAction(
    action: (id: string) => Promise<{ success?: boolean; error?: string }>,
    successKey: string
  ) {
    startTransition(async () => {
      const result = await action(rental.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(successKey);
      }
    });
  }

  const startDate = new Date(rental.startDate);
  const endDate = new Date(rental.endDate);
  const sameYear = startDate.getFullYear() === endDate.getFullYear();

  const dateDisplay = sameYear
    ? `${format.dateTime(startDate, { month: "short", day: "numeric" })} - ${format.dateTime(endDate, { month: "short", day: "numeric", year: "numeric" })}`
    : `${format.dateTime(startDate, { month: "short", day: "numeric", year: "numeric" })} - ${format.dateTime(endDate, { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <Card className="overflow-hidden rounded-2xl shadow-warm-sm hover:shadow-warm-md transition-shadow duration-300 border-stone-200/80">
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          {/* Listing thumbnail */}
          <Link
            href={`/listings/${rental.listing.id}`}
            className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-stone-100"
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
              <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                {t("card.noImage")}
              </div>
            )}
          </Link>

          {/* Details */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/listings/${rental.listing.id}`}
                className="truncate font-medium text-sm text-stone-900 hover:underline"
              >
                {rental.listing.title}
              </Link>
              <RentalStatusBadge status={rental.status} />
            </div>

            {/* Other party */}
            {otherParty && (
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <div className="relative size-4 shrink-0 overflow-hidden rounded-full bg-stone-200">
                  {otherParty.image ? (
                    <Image
                      src={otherParty.image}
                      alt={otherParty.name}
                      fill
                      className="object-cover"
                      sizes="16px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[8px] font-medium">
                      {otherParty.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span>
                  {role === "owner" ? t("card.renter") : t("card.owner")}: {otherParty.name}
                </span>
              </div>
            )}

            {/* Date range and pricing */}
            <p className="text-xs text-stone-500">{dateDisplay}</p>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-stone-900">
                ${rental.totalPrice.toFixed(2)}
              </span>
              <span className="text-stone-400">
                {t("card.deposit", { amount: `$${rental.securityDeposit.toFixed(2)}` })}
              </span>
            </div>

            {/* Message preview */}
            {rental.message && (
              <p className="mt-1 text-xs text-stone-400 line-clamp-1 italic">
                &ldquo;{rental.message}&rdquo;
              </p>
            )}

            {/* View details link */}
            <Link
              href={`/rentals/${rental.id}`}
              className="mt-1 inline-flex items-center text-xs font-medium text-primary hover:underline"
            >
              {t("detail.viewDetails" as Parameters<typeof t>[0])}
              <ChevronRight className="ml-0.5 size-3" />
            </Link>
          </div>
        </div>

        {/* Action buttons */}
        {role === "owner" && (
          <div className="border-stone-100 border-t px-4 py-3 bg-stone-50/50">
            {rental.status === "requested" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 shadow-warm-xs"
                  onClick={() =>
                    handleAction(approveRental, t("card.approved"))
                  }
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1 size-3.5" />
                  )}
                  {t("actions.approve")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-warm-xs"
                  onClick={() =>
                    handleAction(declineRental, t("card.declined"))
                  }
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <X className="mr-1 size-3.5" />
                  )}
                  {t("actions.decline")}
                </Button>
              </div>
            )}

            {rental.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                className="w-full shadow-warm-xs"
                onClick={() =>
                  handleAction(markReturned, t("card.markedReturned"))
                }
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1 size-3.5" />
                )}
                {t("actions.markReturned")}
              </Button>
            )}

            {rental.status === "returned" && (
              <Button
                size="sm"
                className="w-full shadow-warm-xs"
                onClick={() =>
                  handleAction(completeRental, t("card.completed"))
                }
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="mr-1 size-3.5" />
                )}
                {t("actions.complete")}
              </Button>
            )}
          </div>
        )}

        {/* QR Handoff button */}
        {(rental.status === "approved" || rental.status === "active") && (
          <div className="border-stone-100 border-t px-4 py-3 bg-stone-50/50">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={`/rentals/${rental.id}/handoff`}>
                <QrCode className="mr-1 size-3.5" />
                {t("card.handoff")}
              </Link>
            </Button>
          </div>
        )}

        {/* Review section for completed rentals */}
        {rental.status === "completed" && (
          <div className="border-stone-100 border-t px-4 py-3 bg-stone-50/50 flex items-center justify-between">
            {hasReviewedByUser ? (
              <Badge variant="secondary" className="gap-1">
                <CheckCheck className="size-3" />
                {t("card.reviewed")}
              </Badge>
            ) : (
              <ReviewForm
                rentalId={rental.id}
                revieweeId={
                  role === "renter"
                    ? (rental.owner?.id ?? "")
                    : (rental.renter?.id ?? "")
                }
                revieweeName={
                  role === "renter"
                    ? (rental.owner?.name ?? "User")
                    : (rental.renter?.name ?? "User")
                }
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
