"use client";

import { useTransition, useCallback } from "react";
import Image from "next/image";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approveListing } from "@/features/admin/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RejectDialog } from "./reject-dialog";

interface ModerationCardProps {
  listing: {
    id: string;
    title: string;
    status: string;
    moderationResult: string | null;
    createdAt: Date;
    owner: { name: string; email: string };
    images: Array<{ url: string; isCover: boolean }>;
    category: { name: string };
  };
  onAction: () => void;
}

function parseModerationResult(raw: string | null): {
  flagReason?: string;
  confidence?: number;
} {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return {
      flagReason: parsed.flagReason || parsed.reason || undefined,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined,
    };
  } catch {
    return {};
  }
}

export function ModerationCard({ listing, onAction }: ModerationCardProps) {
  const [isPending, startTransition] = useTransition();
  const modResult = parseModerationResult(listing.moderationResult);
  const coverImage = listing.images[0]?.url;

  const handleApprove = useCallback(() => {
    startTransition(async () => {
      const result = await approveListing(listing.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`"${listing.title}" has been approved`);
        onAction();
      }
    });
  }, [listing.id, listing.title, onAction]);

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Thumbnail */}
          {coverImage && (
            <div className="relative w-full sm:w-40 h-32 shrink-0 rounded-md overflow-hidden bg-gray-100">
              <Image
                src={coverImage}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="160px"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{listing.title}</h3>
                <p className="text-sm text-muted-foreground">
                  by {listing.owner.name} ({listing.owner.email})
                </p>
              </div>
              <Badge variant="secondary">{listing.category.name}</Badge>
            </div>

            {/* AI Flag Info */}
            {modResult.flagReason && (
              <div className="rounded-md bg-orange-50 border border-orange-200 p-3">
                <p className="text-sm font-medium text-orange-800">
                  AI Flag Reason
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  {modResult.flagReason}
                </p>
                {modResult.confidence !== undefined && (
                  <p className="text-xs text-orange-600 mt-1">
                    Confidence: {Math.round(modResult.confidence * 100)}%
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-50"
                onClick={handleApprove}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle className="size-4" />
                )}
                Approve
              </Button>
              <RejectDialog
                listingId={listing.id}
                listingTitle={listing.title}
                onRejected={onAction}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
