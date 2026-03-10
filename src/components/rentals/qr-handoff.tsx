"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { QrCode, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { confirmPickup, confirmReturn } from "@/features/rentals/actions";

interface QRHandoffProps {
  rental: {
    id: string;
    status: string;
    handoffCode: string | null;
    listing: { title: string };
    renter: { id: string; name: string };
    owner: { id: string; name: string };
  };
  qrDataURL: string;
  isOwner: boolean;
  isRenter: boolean;
}

export function QRHandoff({ rental, qrDataURL, isOwner, isRenter }: QRHandoffProps) {
  const t = useTranslations("Handoff");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [manualCode, setManualCode] = useState("");

  // Owner shows QR for pickup, renter enters code
  // For return: renter shows QR, owner enters code
  const showQR = isOwner; // owner always shows QR (for pickup)
  const showInput = isRenter; // renter enters code (for pickup)

  function handleConfirm() {
    if (!manualCode.trim()) {
      toast.error(t("enterCode"));
      return;
    }

    startTransition(async () => {
      // Renter confirms pickup, Owner confirms return
      const action = isRenter ? confirmPickup : confirmReturn;
      const result = await action(rental.id, manualCode.trim());

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isRenter ? t("pickupConfirmed") : t("returnConfirmed"));
        router.push("/rentals");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="size-5" />
          {isRenter ? t("pickupTitle") : t("returnTitle")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("listing")}: {rental.listing.title}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {showQR && (
          <div className="text-center space-y-3">
            <p className="text-sm">{isRenter ? t("enterPickupCode") : t("showToRenter")}</p>
            <Image
              src={qrDataURL}
              alt="Handoff QR Code"
              width={300}
              height={300}
              className="mx-auto rounded-lg border"
            />
            <div className="rounded-md bg-muted px-4 py-2">
              <p className="text-xs text-muted-foreground">{t("orShareCode")}</p>
              <p className="text-2xl font-mono font-bold tracking-widest">
                {rental.handoffCode}
              </p>
            </div>
          </div>
        )}

        {showInput && (
          <div className="space-y-3">
            <p className="text-sm">{t("enterPickupCode")}</p>
            <Input
              placeholder={t("codePlaceholder")}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="text-center text-lg font-mono tracking-widest"
              maxLength={10}
            />
            <Button
              onClick={handleConfirm}
              disabled={isPending || !manualCode.trim()}
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle className="size-4" />
              )}
              {isRenter ? t("confirmPickup") : t("confirmReturn")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
