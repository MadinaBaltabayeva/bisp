"use client";

import { CreditCard, CheckCircle } from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PaymentInfoProps {
  payment: {
    method: string;
    cardLast4: string;
    amount: number;
    status: string;
    createdAt: Date;
  };
}

export function PaymentInfo({ payment }: PaymentInfoProps) {
  const t = useTranslations("Rentals.detail");
  const format = useFormatter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="size-4" />
          {t("paymentInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{t("paymentMethod")}</p>
            <p className="font-medium">{t("paymentCard")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("paymentCard")}</p>
            <p className="font-medium">****{payment.cardLast4}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("paymentAmount")}</p>
            <p className="font-medium">${payment.amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("paymentStatus")}</p>
            <Badge
              variant="outline"
              className="mt-0.5 border-green-300 bg-green-50 text-green-700"
            >
              <CheckCircle className="mr-1 size-3" />
              {t("paid")}
            </Badge>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">{t("paymentDate")}</p>
            <p className="font-medium">
              {new Date(payment.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
