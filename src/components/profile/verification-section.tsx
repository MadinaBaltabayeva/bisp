"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VerificationWizard } from "./verification-wizard";

interface VerificationSectionProps {
  isVerified: boolean;
}

export function VerificationSection({ isVerified }: VerificationSectionProps) {
  const t = useTranslations("Verification");
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const handleComplete = () => {
    // Close dialog after a short delay so user sees success state
    setTimeout(() => {
      setDialogOpen(false);
      router.refresh();
    }, 1500);
  };

  if (isVerified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center gap-4 py-6">
          <BadgeCheck className="size-10 shrink-0 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-800">
              {t("verified")}
            </h3>
            <p className="text-sm text-green-700">
              {t("verifiedDescription")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center">
          <ShieldAlert className="size-10 shrink-0 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {t("verifyTitle")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("verifyDescription")}
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            {t("startVerification")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <VerificationWizard onComplete={handleComplete} />
        </DialogContent>
      </Dialog>
    </>
  );
}
