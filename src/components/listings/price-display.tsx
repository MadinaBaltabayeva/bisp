"use client";

import { useTranslations, useFormatter } from "next-intl";

interface PriceDisplayProps {
  priceHourly: number | null;
  priceDaily: number | null;
  priceWeekly: number | null;
  priceMonthly: number | null;
}

interface RateInfo {
  amount: number;
  suffixKey: "perHour" | "perDay" | "perWeek" | "perMonth";
}

export function PriceDisplay({
  priceHourly,
  priceDaily,
  priceWeekly,
  priceMonthly,
}: PriceDisplayProps) {
  const t = useTranslations("Listings.detail");
  const format = useFormatter();

  function formatAmount(amount: number): string {
    return format.number(amount, { style: "currency", currency: "USD" });
  }

  const SUFFIX_MAP: Record<string, string> = {
    perHour: "/hr",
    perDay: "/day",
    perWeek: "/wk",
    perMonth: "/mo",
  };

  const rates: RateInfo[] = [];

  if (priceHourly != null) {
    rates.push({ amount: priceHourly, suffixKey: "perHour" });
  }
  if (priceDaily != null) {
    rates.push({ amount: priceDaily, suffixKey: "perDay" });
  }
  if (priceWeekly != null) {
    rates.push({ amount: priceWeekly, suffixKey: "perWeek" });
  }
  if (priceMonthly != null) {
    rates.push({ amount: priceMonthly, suffixKey: "perMonth" });
  }

  if (rates.length === 0) {
    return <p className="text-muted-foreground">{t("contactForPricing")}</p>;
  }

  // Primary rate: the one with the lowest amount
  const sortedRates = [...rates].sort((a, b) => a.amount - b.amount);
  const primary = sortedRates[0];
  const otherRates = rates.filter((r) => r !== primary);

  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold">{formatAmount(primary.amount)}</span>
        <span className="text-lg text-muted-foreground">{SUFFIX_MAP[primary.suffixKey]}</span>
      </div>
      {otherRates.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
          {otherRates.map((rate) => (
            <span key={rate.suffixKey}>
              {formatAmount(rate.amount)}
              {SUFFIX_MAP[rate.suffixKey]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
