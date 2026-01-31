"use client";

import { useTransition } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { format } from "date-fns";
import { Loader2, Check, X, RotateCcw, CheckCircle, CheckCheck } from "lucide-react";
import { toast } from "sonner";

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
  const [isPending, startTransition] = useTransition();

  const otherParty = role === "owner" ? rental.renter : rental.owner;
  const coverImage = rental.listing.images[0]?.url;

  function handleAction(
    action: (id: string) => Promise<{ success?: boolean; error?: string }>,
    successMessage: string
  ) {
    startTransition(async () => {
      const result = await action(rental.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(successMessage);
      }
    });
  }

  const startDate = new Date(rental.startDate);
  const endDate = new Date(rental.endDate);
  const sameYear = startDate.getFullYear() === endDate.getFullYear();

  const dateDisplay = sameYear
    ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
    : `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          {/* Listing thumbnail */}
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
                No image
              </div>
            )}
          </Link>

          {/* Details */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/listings/${rental.listing.id}`}
                className="truncate font-medium text-sm hover:underline"
              >
                {rental.listing.title}
              </Link>
              <RentalStatusBadge status={rental.status} />
            </div>

            {/* Other party */}
            {otherParty && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="relative size-4 shrink-0 overflow-hidden rounded-full bg-muted">
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
                  {role === "owner" ? "Renter" : "Owner"}: {otherParty.name}
                </span>
              </div>
            )}

            {/* Date range and pricing */}
            <p className="text-xs text-muted-foreground">{dateDisplay}</p>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-medium">
                ${rental.totalPrice.toFixed(2)}
              </span>
              <span className="text-muted-foreground">
                Deposit: ${rental.securityDeposit.toFixed(2)}
              </span>
            </div>

            {/* Message preview */}
            {rental.message && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-1 italic">
                &ldquo;{rental.message}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {role === "owner" && (
          <div className="border-t px-4 py-2">
            {rental.status === "requested" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() =>
                    handleAction(approveRental, "Rental approved!")
                  }
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1 size-3.5" />
                  )}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() =>
                    handleAction(declineRental, "Rental declined.")
                  }
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <X className="mr-1 size-3.5" />
                  )}
                  Decline
                </Button>
              </div>
            )}

            {rental.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() =>
                  handleAction(markReturned, "Item marked as returned.")
                }
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1 size-3.5" />
                )}
                Mark Returned
              </Button>
            )}

            {rental.status === "returned" && (
              <Button
                size="sm"
                className="w-full"
                onClick={() =>
                  handleAction(completeRental, "Rental completed!")
                }
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="mr-1 size-3.5" />
                )}
                Complete Rental
              </Button>
            )}
          </div>
        )}

        {/* Review section for completed rentals */}
        {rental.status === "completed" && (
          <div className="border-t px-4 py-2 flex items-center justify-between">
            {hasReviewedByUser ? (
              <Badge variant="secondary" className="gap-1">
                <CheckCheck className="size-3" />
                Reviewed
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
