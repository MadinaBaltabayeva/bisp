"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useFormatter } from "next-intl";

import { resolveDispute } from "@/features/disputes/actions";
import type { getOpenDisputes } from "@/features/disputes/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type DisputeItem = Awaited<ReturnType<typeof getOpenDisputes>>[number];

interface DisputeCardProps {
  dispute: DisputeItem;
}

export function DisputeCard({ dispute }: DisputeCardProps) {
  const t = useTranslations("Admin.disputes");
  const format = useFormatter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [clickedResolution, setClickedResolution] = useState<string | null>(
    null
  );

  function handleResolve(
    resolution: "favor_renter" | "favor_owner" | "dismiss"
  ) {
    setClickedResolution(resolution);
    startTransition(async () => {
      const result = await resolveDispute(
        dispute.id,
        resolution,
        note || undefined
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("resolveSuccess"));
      }
      setClickedResolution(null);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {dispute.rental.listing.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("disputeBy")} {dispute.openedBy.name}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reason */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("reason")}
          </p>
          <p className="mt-1 text-sm">{dispute.reason}</p>
        </div>

        {/* Parties */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("parties")}
          </p>
          <div className="mt-2 flex items-center gap-6">
            {/* Renter */}
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                {dispute.rental.renter?.image && (
                  <AvatarImage src={dispute.rental.renter.image} />
                )}
                <AvatarFallback>
                  {dispute.rental.renter?.name?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">{t("renter")}</p>
                <p className="text-sm font-medium">
                  {dispute.rental.renter?.name}
                </p>
              </div>
            </div>

            {/* Owner */}
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                {dispute.rental.owner?.image && (
                  <AvatarImage src={dispute.rental.owner.image} />
                )}
                <AvatarFallback>
                  {dispute.rental.owner?.name?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">{t("owner")}</p>
                <p className="text-sm font-medium">
                  {dispute.rental.owner?.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Opened date */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("opened")}
          </p>
          <p className="mt-1 text-sm">
            {format.dateTime(new Date(dispute.createdAt), {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Resolution note */}
        <div>
          <Textarea
            placeholder={t("resolutionNotePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("resolutionNote")}
          </p>
        </div>

        {/* Resolution buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            disabled={isPending}
            onClick={() => handleResolve("favor_renter")}
          >
            {isPending && clickedResolution === "favor_renter" && (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            )}
            {t("favorRenter")}
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={isPending}
            onClick={() => handleResolve("favor_owner")}
          >
            {isPending && clickedResolution === "favor_owner" && (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            )}
            {t("favorOwner")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={isPending}
            onClick={() => handleResolve("dismiss")}
          >
            {isPending && clickedResolution === "dismiss" && (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            )}
            {t("dismiss")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
