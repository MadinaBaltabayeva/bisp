"use client";

import { useState, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInCalendarDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations, useFormatter } from "next-intl";

import {
  rentalRequestSchema,
  type PeriodType,
  type RentalRequestInput,
  type RentalRequestValues,
} from "@/lib/validations/rental";
import { createRentalRequest } from "@/features/rentals/actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface RentalRequestFormProps {
  listingId: string;
  priceHourly: number | null;
  priceDaily: number | null;
  priceWeekly: number | null;
  priceMonthly: number | null;
  bookedDates: { startDate: string; endDate: string; status: string }[];
}

const PERIOD_PRIORITY: PeriodType[] = ["daily", "hourly", "weekly", "monthly"];

const HOURS = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 8; // 08:00 - 22:00
  return { value: hour.toString(), label: `${hour.toString().padStart(2, "0")}:00` };
});

export function RentalRequestForm({
  listingId,
  priceHourly,
  priceDaily,
  priceWeekly,
  priceMonthly,
  bookedDates,
}: RentalRequestFormProps) {
  const t = useTranslations("Rentals.requestForm");
  const tCard = useTranslations("Rentals.card");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const format = useFormatter();

  // Determine available period types
  const priceMap: Record<PeriodType, number | null> = {
    hourly: priceHourly,
    daily: priceDaily,
    weekly: priceWeekly,
    monthly: priceMonthly,
  };

  const availablePeriods = useMemo(
    () => PERIOD_PRIORITY.filter((p) => priceMap[p] != null && priceMap[p]! > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [priceHourly, priceDaily, priceWeekly, priceMonthly]
  );

  const defaultPeriod = availablePeriods[0] ?? "daily";
  const [periodType, setPeriodType] = useState<PeriodType>(defaultPeriod);

  // Date/time state
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [singleDate, setSingleDate] = useState<Date | undefined>();
  const [startHour, setStartHour] = useState("9");
  const [endHour, setEndHour] = useState("17");

  const form = useForm<RentalRequestInput, unknown, RentalRequestValues>({
    resolver: zodResolver(rentalRequestSchema),
    defaultValues: {
      listingId,
      periodType: defaultPeriod,
      message: "",
    },
  });

  // Parse booked dates into disabled matchers for the calendar
  const bookedRanges = useMemo(
    () =>
      bookedDates.map((bd) => ({
        from: new Date(bd.startDate),
        to: new Date(bd.endDate),
      })),
    [bookedDates]
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const disabledMatcher = useMemo(
    () => [{ before: today }, ...bookedRanges],
    [today, bookedRanges]
  );

  // Calculate price based on period type
  const priceCalc = useMemo(() => {
    const rate = priceMap[periodType] ?? 0;

    if (periodType === "hourly") {
      if (!singleDate) return null;
      const hours = Math.max(0, parseInt(endHour) - parseInt(startHour));
      if (hours <= 0) return null;
      const totalPrice = hours * rate;
      return {
        units: hours,
        unitLabel: t("hoursCount", { count: hours }),
        rate,
        rateLabel: t("perHour"),
        totalPrice,
        deposit: totalPrice * 0.2,
      };
    }

    if (!dateRange?.from || !dateRange?.to) return null;
    const days = differenceInCalendarDays(dateRange.to, dateRange.from);
    if (days <= 0) return null;

    switch (periodType) {
      case "daily": {
        const totalPrice = days * rate;
        return {
          units: days,
          unitLabel: tCard("daysCount", { count: days }),
          rate,
          rateLabel: tCard("perDay"),
          totalPrice,
          deposit: totalPrice * 0.2,
        };
      }
      case "weekly": {
        const weeks = Math.ceil(days / 7);
        const totalPrice = weeks * rate;
        return {
          units: weeks,
          unitLabel: t("weeksCount", { count: weeks }),
          rate,
          rateLabel: t("perWeek"),
          totalPrice,
          deposit: totalPrice * 0.2,
        };
      }
      case "monthly": {
        const months = Math.ceil(days / 30);
        const totalPrice = months * rate;
        return {
          units: months,
          unitLabel: t("monthsCount", { count: months }),
          rate,
          rateLabel: t("perMonth"),
          totalPrice,
          deposit: totalPrice * 0.2,
        };
      }
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodType, dateRange, singleDate, startHour, endHour, priceHourly, priceDaily, priceWeekly, priceMonthly]);

  function handlePeriodChange(newPeriod: PeriodType) {
    setPeriodType(newPeriod);
    form.setValue("periodType", newPeriod);
    // Reset date selections when switching period
    setDateRange(undefined);
    setSingleDate(undefined);
    form.setValue("startDate", "" as unknown as string);
    form.setValue("endDate", "" as unknown as string);
  }

  function handleDateRangeSelect(range: DateRange | undefined) {
    setDateRange(range);
    if (range?.from) {
      form.setValue("startDate", range.from.toISOString());
    }
    if (range?.to) {
      form.setValue("endDate", range.to.toISOString());
    }
  }

  function handleSingleDateSelect(date: Date | undefined) {
    setSingleDate(date);
    if (date) {
      const start = new Date(date);
      start.setHours(parseInt(startHour), 0, 0, 0);
      form.setValue("startDate", start.toISOString());

      const end = new Date(date);
      end.setHours(parseInt(endHour), 0, 0, 0);
      form.setValue("endDate", end.toISOString());
    }
  }

  function handleStartHourChange(hour: string) {
    setStartHour(hour);
    if (singleDate) {
      const start = new Date(singleDate);
      start.setHours(parseInt(hour), 0, 0, 0);
      form.setValue("startDate", start.toISOString());
    }
  }

  function handleEndHourChange(hour: string) {
    setEndHour(hour);
    if (singleDate) {
      const end = new Date(singleDate);
      end.setHours(parseInt(hour), 0, 0, 0);
      form.setValue("endDate", end.toISOString());
    }
  }

  function onSubmit(values: RentalRequestValues) {
    startTransition(async () => {
      const result = await createRentalRequest(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("success"));
        setOpen(false);
        setDateRange(undefined);
        setSingleDate(undefined);
        form.reset();
      }
    });
  }

  const canSubmit = priceCalc != null && priceCalc.totalPrice > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          {t("requestToRent")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Period Type Selector */}
          {availablePeriods.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("periodLabel")}</label>
              <div className="flex gap-1 rounded-lg border p-1">
                {availablePeriods.map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => handlePeriodChange(period)}
                    className={cn(
                      "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      periodType === period
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {t(period)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date/Time Picker - adaptive based on period type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("rentalDates")}</label>

            {periodType === "hourly" ? (
              /* Hourly: single date + time selectors */
              <div className="space-y-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !singleDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {singleDate
                        ? format.dateTime(singleDate, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : t("selectDates")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={singleDate}
                      onSelect={handleSingleDateSelect}
                      disabled={disabledMatcher}
                      modifiers={{ booked: bookedRanges }}
                      modifiersClassNames={{
                        booked: "bg-red-100 text-red-400 line-through",
                      }}
                    />
                  </PopoverContent>
                </Popover>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {t("startTime")}
                    </label>
                    <Select value={startHour} onValueChange={handleStartHourChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => (
                          <SelectItem key={h.value} value={h.value}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {t("endTime")}
                    </label>
                    <Select value={endHour} onValueChange={handleEndHourChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => (
                          <SelectItem key={h.value} value={h.value}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              /* Daily/Weekly/Monthly: date range picker */
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format.dateTime(dateRange.from, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          -{" "}
                          {format.dateTime(dateRange.to, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </>
                      ) : (
                        format.dateTime(dateRange.from, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      )
                    ) : (
                      t("selectDates")
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleDateRangeSelect}
                    numberOfMonths={2}
                    disabled={disabledMatcher}
                    modifiers={{ booked: bookedRanges }}
                    modifiersClassNames={{
                      booked: "bg-red-100 text-red-400 line-through",
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}

            {form.formState.errors.startDate && (
              <p className="text-sm text-destructive">
                {form.formState.errors.startDate.message}
              </p>
            )}
            {form.formState.errors.endDate && (
              <p className="text-sm text-destructive">
                {form.formState.errors.endDate.message}
              </p>
            )}
          </div>

          {/* Booked dates legend */}
          {bookedDates.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block size-3 rounded bg-red-100 border border-red-200" />
              {t("bookedDates")}
            </div>
          )}

          {/* Price Calculation */}
          {priceCalc && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>
                  {priceCalc.unitLabel} x ${priceCalc.rate.toFixed(2)}
                  {priceCalc.rateLabel}
                </span>
                <span className="font-medium">
                  ${priceCalc.totalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{tCard("estimatedDeposit")}</span>
                <span>${priceCalc.deposit.toFixed(2)}</span>
              </div>
              <div className="border-t pt-1 mt-1 flex justify-between text-sm font-semibold">
                <span>{tCard("total")}</span>
                <span>${priceCalc.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("messageToOwner")}{" "}
              <span className="text-muted-foreground font-normal">
                ({t("messageOptional")})
              </span>
            </label>
            <Textarea
              placeholder={t("messagePlaceholder")}
              maxLength={500}
              {...form.register("message")}
            />
            {form.formState.errors.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.message.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
