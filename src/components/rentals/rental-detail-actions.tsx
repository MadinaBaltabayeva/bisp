"use client";

import { useTransition } from "react";
import {
  Loader2,
  Check,
  X,
  RotateCcw,
  CheckCircle,
  CheckCheck,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  approveRental,
  declineRental,
  markReturned,
  completeRental,
} from "@/features/rentals/actions";
import { Link } from "@/i18n/navigation";
import { ReviewForm } from "@/components/reviews/review-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RentalDetailActionsProps {
  rentalId: string;
  status: string;
  role: "renter" | "owner";
  hasReviewedByUser: boolean;
  revieweeId: string;
  revieweeName: string;
}

export function RentalDetailActions({
  rentalId,
  status,
  role,
  hasReviewedByUser,
  revieweeId,
  revieweeName,
}: RentalDetailActionsProps) {
  const t = useTranslations("Rentals");
  const [isPending, startTransition] = useTransition();

  function handleAction(
    action: (id: string) => Promise<{ success?: boolean; error?: string }>,
    successKey: string
  ) {
    startTransition(async () => {
      const result = await action(rentalId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(successKey);
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Pay Now button for renter when approved */}
      {role === "renter" && status === "approved" && (
        <Link href={`/rentals/${rentalId}/checkout`}>
          <Button className="w-full" size="lg">
            <CreditCard className="mr-1.5 size-4" />
            {t("detail.payNow")}
          </Button>
        </Link>
      )}

      {/* Awaiting payment badge for owner when approved */}
      {role === "owner" && status === "approved" && (
        <div className="flex justify-center">
          <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
            {t("detail.awaitingPayment")}
          </Badge>
        </div>
      )}

      {/* Owner action buttons */}
      {role === "owner" && status === "requested" && (
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() =>
              handleAction(approveRental, t("card.approved"))
            }
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Check className="mr-1.5 size-4" />
            )}
            {t("actions.approve")}
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() =>
              handleAction(declineRental, t("card.declined"))
            }
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <X className="mr-1.5 size-4" />
            )}
            {t("actions.decline")}
          </Button>
        </div>
      )}

      {role === "owner" && status === "active" && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() =>
            handleAction(markReturned, t("card.markedReturned"))
          }
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-1.5 size-4" />
          )}
          {t("actions.markReturned")}
        </Button>
      )}

      {role === "owner" && status === "returned" && (
        <Button
          className="w-full"
          onClick={() =>
            handleAction(completeRental, t("card.completed"))
          }
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-1.5 size-4" />
          )}
          {t("actions.complete")}
        </Button>
      )}

      {/* Review section for completed rentals */}
      {status === "completed" && (
        <div className="flex items-center justify-center">
          {hasReviewedByUser ? (
            <Badge variant="secondary" className="gap-1">
              <CheckCheck className="size-3" />
              {t("card.reviewed")}
            </Badge>
          ) : (
            <ReviewForm
              rentalId={rentalId}
              revieweeId={revieweeId}
              revieweeName={revieweeName}
            />
          )}
        </div>
      )}
    </div>
  );
}
