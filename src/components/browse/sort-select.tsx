"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "date", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "relevance", label: "Most Relevant" },
] as const;

export function SortSelect() {
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
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
