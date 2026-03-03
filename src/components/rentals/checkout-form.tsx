"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import {
  paymentFormSchema,
  type PaymentFormValues,
} from "@/lib/validations/payment";
import { processPayment } from "@/features/rentals/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CheckoutFormProps {
  rentalId: string;
  totalPrice: number;
  securityDeposit: number;
  dailyRate: number;
  days: number;
}

export function CheckoutForm({
  rentalId,
  totalPrice,
  securityDeposit,
  dailyRate,
  days,
}: CheckoutFormProps) {
  const t = useTranslations("Checkout");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
  });

  const grandTotal = totalPrice + securityDeposit;

  function onSubmit(values: PaymentFormValues) {
    setIsProcessing(true);

    setTimeout(() => {
      startTransition(async () => {
        try {
          const result = await processPayment(rentalId, values);
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success(t("paymentSuccess"));
            router.push(`/rentals/${rentalId}`);
          }
        } catch {
          toast.error("Something went wrong. Please try again.");
        } finally {
          setIsProcessing(false);
        }
      });
    }, 1500);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      {/* Card Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4" />
            {t("cardForm")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">{t("cardNumber")}</Label>
            <Input
              id="cardNumber"
              placeholder={t("cardPlaceholder")}
              maxLength={16}
              inputMode="numeric"
              {...register("cardNumber")}
            />
            {errors.cardNumber && (
              <p className="text-xs text-destructive">
                {errors.cardNumber.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">{t("expiry")}</Label>
              <Input
                id="expiry"
                placeholder={t("expiryPlaceholder")}
                maxLength={5}
                {...register("expiry")}
              />
              {errors.expiry && (
                <p className="text-xs text-destructive">
                  {errors.expiry.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvc">{t("cvc")}</Label>
              <Input
                id="cvc"
                placeholder={t("cvcPlaceholder")}
                maxLength={3}
                inputMode="numeric"
                {...register("cvc")}
              />
              {errors.cvc && (
                <p className="text-xs text-destructive">
                  {errors.cvc.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardholderName">{t("cardholderName")}</Label>
            <Input
              id="cardholderName"
              placeholder={t("cardholderName")}
              {...register("cardholderName")}
            />
            {errors.cardholderName && (
              <p className="text-xs text-destructive">
                {errors.cardholderName.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isPending || isProcessing}
      >
        {isProcessing || isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t("processing")}
          </>
        ) : (
          t("completePayment")
        )}
      </Button>
    </form>
  );
}
