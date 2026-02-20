"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toggleListingAvailability } from "@/features/listings/actions";

interface AvailabilityToggleProps {
  listingId: string;
  isAvailable: boolean;
}

export function AvailabilityToggle({
  listingId,
  isAvailable,
}: AvailabilityToggleProps) {
  const t = useTranslations("Listings.availability");
  const [isPending, startTransition] = useTransition();
  const [optimisticAvailable, setOptimisticAvailable] =
    useOptimistic(isAvailable);

  function handleToggle() {
    startTransition(async () => {
      setOptimisticAvailable(!optimisticAvailable);
      const result = await toggleListingAvailability(listingId);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(
        result.status === "active"
          ? t("markedAvailable")
          : t("markedUnavailable")
      );
    });
  }

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.preventDefault()}
    >
      <Switch
        checked={optimisticAvailable}
        onCheckedChange={handleToggle}
        disabled={isPending}
        size="sm"
        aria-label={
          optimisticAvailable ? t("toggleUnavailable") : t("toggleAvailable")
        }
      />
      <span className="text-xs text-muted-foreground">
        {optimisticAvailable ? t("available") : t("unavailable")}
      </span>
      {!optimisticAvailable && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {t("unavailable")}
        </Badge>
      )}
    </div>
  );
}
