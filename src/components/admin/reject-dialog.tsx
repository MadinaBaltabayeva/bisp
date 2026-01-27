"use client";

import { useState, useTransition } from "react";
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
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (reason.trim().length < 10) {
      toast.error("Rejection reason must be at least 10 characters");
      return;
    }

    startTransition(async () => {
      const result = await rejectListing(listingId, reason);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`"${listingTitle}" has been rejected`);
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
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Listing</DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting &quot;{listingTitle}&quot;. This will
            be recorded in the moderation log.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Textarea
            placeholder="Enter rejection reason (minimum 10 characters)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            {reason.length}/10 characters minimum
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPending || reason.trim().length < 10}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Reject Listing"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
