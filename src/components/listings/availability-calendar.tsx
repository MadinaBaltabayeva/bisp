"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarOff, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { addAvailabilityBlock, removeAvailabilityBlock } from "@/features/availability/actions";
import type { DateRange } from "react-day-picker";

interface AvailabilityBlock {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}

interface AvailabilityCalendarProps {
  listingId: string;
  blocks: AvailabilityBlock[];
}

export function AvailabilityCalendar({ listingId, blocks }: AvailabilityCalendarProps) {
  const t = useTranslations("Availability");
  const [isPending, startTransition] = useTransition();
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");

  const blockedDays = blocks.map((b) => ({
    from: new Date(b.startDate),
    to: new Date(b.endDate),
  }));

  function handleAddBlock() {
    if (!selectedRange?.from || !selectedRange?.to) return;

    startTransition(async () => {
      const result = await addAvailabilityBlock(
        listingId,
        selectedRange.from!,
        selectedRange.to!,
        reason
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("blockAdded"));
        setSelectedRange(undefined);
        setReason("");
      }
    });
  }

  function handleRemoveBlock(blockId: string) {
    startTransition(async () => {
      const result = await removeAvailabilityBlock(blockId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("blockRemoved"));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarOff className="size-5" />
          {t("title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="range"
          selected={selectedRange}
          onSelect={setSelectedRange}
          disabled={[{ before: new Date() }]}
          modifiers={{ blocked: blockedDays }}
          modifiersClassNames={{ blocked: "bg-red-100 text-red-700 line-through" }}
          numberOfMonths={2}
          className="rounded-md border"
        />

        {selectedRange?.from && selectedRange?.to && (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                placeholder={t("reasonPlaceholder")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <Button onClick={handleAddBlock} disabled={isPending} size="sm">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : t("addBlock")}
            </Button>
          </div>
        )}

        {blocks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t("existingBlocks")}</h4>
            {blocks.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">
                    {new Date(block.startDate).toLocaleDateString()} —{" "}
                    {new Date(block.endDate).toLocaleDateString()}
                  </span>
                  {block.reason && (
                    <span className="ml-2 text-muted-foreground">({block.reason})</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveBlock(block.id)}
                  disabled={isPending}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
