"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInCalendarDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations, useFormatter } from "next-intl";

import {
  rentalRequestSchema,
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
import { cn } from "@/lib/utils";

interface RentalRequestFormProps {
  listingId: string;
  priceDaily: number | null;
  priceWeekly: number | null;
}

export function RentalRequestForm({
  listingId,
  priceDaily,
  priceWeekly: _priceWeekly,
}: RentalRequestFormProps) {
  const t = useTranslations("Rentals.requestForm");
  const tCard = useTranslations("Rentals.card");
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isPending, startTransition] = useTransition();
  const format = useFormatter();

  const form = useForm<RentalRequestInput, unknown, RentalRequestValues>({
    resolver: zodResolver(rentalRequestSchema),
    defaultValues: {
      listingId,
      message: "",
    },
  });

  const dailyRate = priceDaily ?? 0;
  const days =
    dateRange?.from && dateRange?.to
      ? differenceInCalendarDays(dateRange.to, dateRange.from)
      : 0;
  const totalPrice = days * dailyRate;
  const securityDeposit = totalPrice * 0.2;

  function handleDateSelect(range: DateRange | undefined) {
    setDateRange(range);
    if (range?.from) {
      form.setValue("startDate", range.from.toISOString());
    }
    if (range?.to) {
      form.setValue("endDate", range.to.toISOString());
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
        form.reset();
      }
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
          {/* Date Range Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("rentalDates")}</label>
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
                        {format.dateTime(dateRange.from, { month: "short", day: "numeric", year: "numeric" })} -{" "}
                        {format.dateTime(dateRange.to, { month: "short", day: "numeric", year: "numeric" })}
                      </>
                    ) : (
                      format.dateTime(dateRange.from, { month: "short", day: "numeric", year: "numeric" })
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
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                  disabled={{ before: today }}
                />
              </PopoverContent>
            </Popover>
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

          {/* Price Calculation */}
          {days > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>
                  {tCard("daysCount", { count: days })} x ${dailyRate.toFixed(2)}{tCard("perDay")}
                </span>
                <span className="font-medium">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{tCard("estimatedDeposit")}</span>
                <span>${securityDeposit.toFixed(2)}</span>
              </div>
              <div className="border-t pt-1 mt-1 flex justify-between text-sm font-semibold">
                <span>{tCard("total")}</span>
                <span>${totalPrice.toFixed(2)}</span>
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
            <Button type="submit" disabled={isPending || days === 0}>
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
