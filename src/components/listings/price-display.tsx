interface PriceDisplayProps {
  priceHourly: number | null;
  priceDaily: number | null;
  priceWeekly: number | null;
  priceMonthly: number | null;
}

interface RateInfo {
  amount: number;
  label: string;
  suffix: string;
}

function formatAmount(amount: number): string {
  return amount % 1 === 0 ? `$${amount}` : `$${amount.toFixed(2)}`;
}

export function PriceDisplay({
  priceHourly,
  priceDaily,
  priceWeekly,
  priceMonthly,
}: PriceDisplayProps) {
  const rates: RateInfo[] = [];

  if (priceHourly != null) {
    rates.push({ amount: priceHourly, label: "per hour", suffix: "/hr" });
  }
  if (priceDaily != null) {
    rates.push({ amount: priceDaily, label: "per day", suffix: "/day" });
  }
  if (priceWeekly != null) {
    rates.push({ amount: priceWeekly, label: "per week", suffix: "/wk" });
  }
  if (priceMonthly != null) {
    rates.push({ amount: priceMonthly, label: "per month", suffix: "/mo" });
  }

  if (rates.length === 0) {
    return <p className="text-muted-foreground">Contact for pricing</p>;
  }

  // Primary rate: the one with the lowest amount
  const sortedRates = [...rates].sort((a, b) => a.amount - b.amount);
  const primary = sortedRates[0];
  const otherRates = rates.filter((r) => r !== primary);

  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold">{formatAmount(primary.amount)}</span>
        <span className="text-lg text-muted-foreground">{primary.suffix}</span>
      </div>
      {otherRates.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
          {otherRates.map((rate) => (
            <span key={rate.suffix}>
              {formatAmount(rate.amount)}
              {rate.suffix}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
