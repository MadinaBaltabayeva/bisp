"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { createCheckoutSession } from "@/features/rentals/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface StripeCheckoutButtonProps {
  rentalId: string;
  totalPrice: number;
  securityDeposit: number;
  dailyRate: number;
  days: number;
}

export function StripeCheckoutButton({
  rentalId,
  totalPrice,
  securityDeposit,
  dailyRate,
  days,
}: StripeCheckoutButtonProps) {
  const t = useTranslations("Checkout");
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const locale = (params.locale as string) || "en";

  const grandTotal = totalPrice + securityDeposit;

  async function handleCheckout() {
    setIsLoading(true);
    try {
      const result = await createCheckoutSession(rentalId, locale);
      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Price Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("priceBreakdown")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("dailyRate")} (${dailyRate.toFixed(2)} x {days} {t("days")})
            </span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("securityDeposit")}
            </span>
            <span>${securityDeposit.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>{t("total")}</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Checkout Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4" />
            {t("securePayment")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("stripeDescription")}
          </p>
          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("redirecting")}
              </>
            ) : (
              t("payWithStripe")
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {t("testMode")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
