"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "date", labelKey: "sort.newest" },
  { value: "price_asc", labelKey: "sort.priceAsc" },
  { value: "price_desc", labelKey: "sort.priceDesc" },
  { value: "relevance", labelKey: "sort.relevance" },
] as const;

export function SortSelect() {
  const t = useTranslations("Browse");
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentSort = searchParams.get("sort") ?? "date";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "date") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.replace(`/browse?${params.toString()}`);
  }

  return (
    <Select value={currentSort} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t("sort.label")} />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {t(option.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
