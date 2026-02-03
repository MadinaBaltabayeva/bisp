"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { rejectListing } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface RejectDialogProps {
  listingId: string;
  listingTitle: string;
  onRejected: () => void;
}

export function RejectDialog({
  listingId,
  listingTitle,
  onRejected,
}: RejectDialogProps) {
  const t = useTranslations("Admin.moderation");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (reason.trim().length < 10) {
      toast.error(t("reasonTooShort"));
      return;
    }

    startTransition(async () => {
      const result = await rejectListing(listingId, reason);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("rejectedToast", { title: listingTitle }));
        setOpen(false);
        setReason("");
        onRejected();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
          <XCircle className="size-4" />
          {t("reject")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("rejectListing")}</DialogTitle>
          <DialogDescription>
            {t("rejectDescription", { title: listingTitle })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Textarea
            placeholder={t("reasonMinLength")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            {t("reasonCounter", { count: reason.length })}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPending || reason.trim().length < 10}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("rejecting")}
              </>
            ) : (
              t("rejectListing")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
