"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface PriceSuggestionProps {
  categoryId: string;
  listingId?: string;
  onApply: (prices: {
    priceHourly: number;
    priceDaily: number;
    priceWeekly: number;
    priceMonthly: number;
  }) => void;
}

export function PriceSuggestion({
  categoryId,
  listingId,
  onApply,
}: PriceSuggestionProps) {
  const t = useTranslations("Listings.pricing");
  const [suggestion, setSuggestion] = useState<{
    averageDaily: number;
    count: number;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastCategoryRef = useRef<string>("");

  useEffect(() => {
    if (!categoryId || categoryId === lastCategoryRef.current) {
      return;
    }

    lastCategoryRef.current = categoryId;
    setDismissed(false);
    setLoading(true);
    setSuggestion(null);

    const controller = new AbortController();

    const url = `/api/pricing/suggest?categoryId=${encodeURIComponent(categoryId)}${listingId ? "&excludeId=" + encodeURIComponent(listingId) : ""}`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setSuggestion(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [categoryId, listingId]);

  if (dismissed || (!loading && !suggestion)) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <Sparkles className="size-4 animate-pulse text-primary" />
        <div className="flex flex-1 gap-1">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  function handleApply() {
    if (!suggestion) return;
    const prices = {
      priceDaily: suggestion.averageDaily,
      priceHourly:
        Math.round((suggestion.averageDaily / 8) * 100) / 100,
      priceWeekly:
        Math.round(suggestion.averageDaily * 5 * 100) / 100,
      priceMonthly:
        Math.round(suggestion.averageDaily * 20 * 100) / 100,
    };
    onApply(prices);
    setDismissed(true);
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <Sparkles className="size-4 text-primary" />
      <div className="flex-1 text-sm">
        <span className="font-medium">
          {t("aiSuggests", { price: suggestion!.averageDaily.toFixed(2) })}
        </span>
        <span className="ml-1 text-muted-foreground">
          {t("based", { count: suggestion!.count })}
        </span>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={handleApply}
          className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Check className="size-3" />
          {t("apply")}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="size-3" />
          {t("dismiss")}
        </button>
      </div>
    </div>
  );
}
