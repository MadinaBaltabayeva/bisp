"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useEffect, useMemo } from "react";
import { SlidersHorizontal, MapPin, X, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const US_REGIONS = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California",
  "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
] as const;

const SLUG_TO_KEY: Record<string, string> = {
  tools: "tools",
  electronics: "electronics",
  sports: "sports",
  outdoor: "outdoor",
  vehicles: "vehicles",
  clothing: "clothing",
  music: "music",
  "home-garden": "homeGarden",
};

interface FilterSidebarProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  totalResults: number;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-stone-500">
      {children}
    </div>
  );
}

function FilterContent({ categories, totalResults }: FilterSidebarProps) {
  const t = useTranslations("Browse");
  const tCat = useTranslations("Categories");
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentCategory = searchParams.get("category") ?? "";
  const currentRegion = searchParams.get("region") ?? "";
  const currentMinPrice = searchParams.get("minPrice")
    ? Number(searchParams.get("minPrice"))
    : 0;
  const currentMaxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : 500;
  const currentRadius = searchParams.get("radius")
    ? Number(searchParams.get("radius"))
    : 25;
  const hasLocation =
    searchParams.has("latitude") && searchParams.has("longitude");

  const [priceRange, setPriceRange] = useState([currentMinPrice, currentMaxPrice]);
  const [radius, setRadius] = useState(currentRadius);
  const [locating, setLocating] = useState(false);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/browse?${params.toString()}`);
  }

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value !== null) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`/browse?${params.toString()}`);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const updates: Record<string, string | null> = {};
      updates.minPrice = priceRange[0] > 0 ? String(priceRange[0]) : null;
      updates.maxPrice = priceRange[1] < 500 ? String(priceRange[1]) : null;
      updateParams(updates);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange]);

  useEffect(() => {
    if (!hasLocation) return;
    const timer = setTimeout(() => {
      updateParam("radius", String(radius));
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius]);

  function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        updateParams({
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
          radius: String(radius),
        });
      },
      () => setLocating(false)
    );
  }

  function handleClearLocation() {
    updateParams({ latitude: null, longitude: null, radius: null });
  }

  function handleClearAll() {
    router.replace("/browse");
  }

  return (
    <div className="space-y-8">
      <div className="text-[12px] text-stone-500">
        {t("resultsCount", { count: totalResults })}
      </div>

      <div>
        <SectionHeading>{t("filters.category")}</SectionHeading>
        <ul className="mt-3 space-y-1.5 text-[13px]">
          <li>
            <button
              type="button"
              onClick={() => updateParam("category", null)}
              className={cn(
                "block w-full text-left transition-colors",
                !currentCategory ? "font-medium text-stone-900" : "text-stone-600 hover:text-stone-900"
              )}
            >
              {t("filters.allCategories")}
            </button>
          </li>
          {categories.map((cat) => {
            const active = currentCategory === cat.slug;
            return (
              <li key={cat.slug}>
                <button
                  type="button"
                  onClick={() =>
                    updateParam("category", active ? null : cat.slug)
                  }
                  className={cn(
                    "block w-full text-left transition-colors",
                    active ? "font-medium text-stone-900" : "text-stone-600 hover:text-stone-900"
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {active && <span className="inline-block size-1 rounded-full bg-stone-900" aria-hidden />}
                    <span>{tCat((SLUG_TO_KEY[cat.slug] ?? cat.slug) as Parameters<typeof tCat>[0])}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <SectionHeading>{t("filters.priceRange")}</SectionHeading>
        <div className="mt-3 text-[12px] text-stone-500">
          ${priceRange[0]} – ${priceRange[1]}
          {priceRange[1] >= 500 ? "+" : ""}
        </div>
        <div className="mt-3">
          <Slider
            min={0}
            max={500}
            step={5}
            value={priceRange}
            onValueChange={setPriceRange}
          />
        </div>
      </div>

      <div>
        <SectionHeading>{t("filters.location")}</SectionHeading>
        <div className="mt-3">
          <Select
            value={currentRegion || "all"}
            onValueChange={(value) =>
              updateParam("region", value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("filters.allRegions")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allRegions")}</SelectItem>
              {US_REGIONS.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <SectionHeading>{t("filters.radius")}</SectionHeading>
        {hasLocation ? (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-1.5 text-[12px] text-stone-500">
              <MapPin className="size-3 text-stone-500" />
              <span>Within {radius} miles of you</span>
            </div>
            <Slider
              min={1}
              max={100}
              step={1}
              value={[radius]}
              onValueChange={(val) => setRadius(val[0])}
            />
            <button
              type="button"
              onClick={handleClearLocation}
              className="inline-flex items-center gap-1 text-[12px] text-stone-500 hover:text-stone-900 hover:underline underline-offset-4"
            >
              <X className="size-3" />
              Clear location
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-stone-700 hover:text-stone-900 hover:underline underline-offset-4 disabled:opacity-50"
          >
            <Navigation className="size-3.5" />
            {locating ? "Locating…" : "Use my location"}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleClearAll}
        className="text-[12px] text-stone-500 hover:text-stone-900 hover:underline underline-offset-4"
      >
        {t("filters.reset")}
      </button>
    </div>
  );
}

export function FilterSidebar(props: FilterSidebarProps) {
  const t = useTranslations("Browse");
  const searchParams = useSearchParams();

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchParams.has("category")) count++;
    if (searchParams.has("minPrice") || searchParams.has("maxPrice")) count++;
    if (searchParams.has("region")) count++;
    if (searchParams.has("latitude")) count++;
    return count;
  }, [searchParams]);

  return (
    <>
      <aside className="hidden w-56 shrink-0 self-start sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 lg:block">
        <FilterContent {...props} />
      </aside>

      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="size-4" />
              {t("filters.title")}
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-stone-900 px-1.5 text-[10px] font-medium text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto p-6">
            <SheetHeader className="p-0 pb-6">
              <SheetTitle className="font-serif text-xl font-medium tracking-tight text-stone-900">
                {t("filters.title")}
              </SheetTitle>
            </SheetHeader>
            <FilterContent {...props} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
