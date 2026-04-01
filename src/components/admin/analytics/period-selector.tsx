"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const PRESETS = ["7d", "30d", "6m", "all"] as const;

export function PeriodSelector() {
  const t = useTranslations("Admin.analytics");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPeriod = searchParams.get("period") || "30d";
  const customFrom = searchParams.get("from");
  const customTo = searchParams.get("to");
  const isCustom = !!customFrom;

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: customFrom ? new Date(customFrom) : undefined,
    to: customTo ? new Date(customTo) : undefined,
  });
  const [open, setOpen] = useState(false);

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) sp.set(k, v);
    router.push(`${pathname}?${sp.toString()}`);
  }

  function selectPreset(preset: string) {
    navigate({ period: preset });
  }

  function applyCustomRange() {
    if (dateRange.from && dateRange.to) {
      navigate({
        from: format(dateRange.from, "yyyy-MM-dd"),
        to: format(dateRange.to, "yyyy-MM-dd"),
      });
      setOpen(false);
    }
  }

  const presetLabels: Record<string, string> = {
    "7d": t("7d"),
    "30d": t("30d"),
    "6m": t("6m"),
    all: t("all"),
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <Button
          key={preset}
          variant={!isCustom && currentPeriod === preset ? "default" : "outline"}
          size="sm"
          onClick={() => selectPreset(preset)}
        >
          {presetLabels[preset]}
        </Button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={isCustom ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <CalendarIcon className="size-4" />
            {isCustom && dateRange.from && dateRange.to
              ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
              : t("custom")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
            onSelect={(range) => {
              if (range) setDateRange({ from: range.from, to: range.to });
            }}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
          <div className="border-t p-3 flex justify-end">
            <Button
              size="sm"
              onClick={applyCustomRange}
              disabled={!dateRange.from || !dateRange.to}
            >
              {t("apply")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
