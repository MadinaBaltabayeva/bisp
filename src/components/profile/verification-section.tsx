"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { BadgeCheck, ShieldAlert } from "lucide-react";
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
              Identity Verified
            </h3>
            <p className="text-sm text-green-700">
              Your identity has been verified. A verification badge is
              displayed on your profile and listings.
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
              Verify Your Identity
            </h3>
            <p className="text-sm text-muted-foreground">
              Get a verification badge on your profile and listings. This helps
              build trust with other users.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            Start Verification
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Identity Verification</DialogTitle>
            <DialogDescription>
              Complete the steps below to verify your identity.
            </DialogDescription>
          </DialogHeader>
          <VerificationWizard onComplete={handleComplete} />
        </DialogContent>
      </Dialog>
    </>
  );
}
