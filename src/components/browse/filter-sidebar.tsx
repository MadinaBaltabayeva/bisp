"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  SlidersHorizontal,
  MapPin,
  X,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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

interface FilterSidebarProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  totalResults: number;
}

function FilterContent({ categories, totalResults }: FilterSidebarProps) {
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

  const [priceRange, setPriceRange] = useState([
    currentMinPrice,
    currentMaxPrice,
  ]);
  const [radius, setRadius] = useState(currentRadius);
  const [locating, setLocating] = useState(false);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/browse?${params.toString()}`);
  }

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value !== null) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.replace(`/browse?${params.toString()}`);
  }

  // Debounced price range update
  useEffect(() => {
    const timer = setTimeout(() => {
      const updates: Record<string, string | null> = {};
      if (priceRange[0] > 0) {
        updates.minPrice = String(priceRange[0]);
      } else {
        updates.minPrice = null;
      }
      if (priceRange[1] < 500) {
        updates.maxPrice = String(priceRange[1]);
      } else {
        updates.maxPrice = null;
      }
      updateParams(updates);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange]);

  // Debounced radius update
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
      () => {
        setLocating(false);
      }
    );
  }

  function handleClearLocation() {
    updateParams({
      latitude: null,
      longitude: null,
      radius: null,
    });
  }

  function handleClearAll() {
    router.replace("/browse");
  }

  return (
    <div className="space-y-6">
      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {totalResults} {totalResults === 1 ? "result" : "results"}
      </p>

      {/* Category filter */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Category</h4>
        <div className="space-y-1">
          <button
            onClick={() => updateParam("category", null)}
            className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
              !currentCategory
                ? "bg-primary-50 font-medium text-primary-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() =>
                updateParam(
                  "category",
                  currentCategory === cat.slug ? null : cat.slug
                )
              }
              className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                currentCategory === cat.slug
                  ? "bg-primary-50 font-medium text-primary-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900">
          Price Range
        </h4>
        <p className="mb-3 text-sm text-muted-foreground">
          ${priceRange[0]} - ${priceRange[1]}
          {priceRange[1] >= 500 ? "+" : ""}
        </p>
        <Slider
          min={0}
          max={500}
          step={5}
          value={priceRange}
          onValueChange={setPriceRange}
        />
      </div>

      {/* Region filter */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Region</h4>
        <Select
          value={currentRegion || "all"}
          onValueChange={(value) =>
            updateParam("region", value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {US_REGIONS.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Distance filter */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Distance</h4>
        {hasLocation ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-3.5 text-green-600" />
              <span>Filtering by distance from your location</span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              Within {radius} miles
            </p>
            <Slider
              min={1}
              max={100}
              step={1}
              value={[radius]}
              onValueChange={(val) => setRadius(val[0])}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearLocation}
              className="text-muted-foreground"
            >
              <X className="mr-1 size-3.5" />
              Clear location
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="w-full"
          >
            <Navigation className="mr-2 size-3.5" />
            {locating ? "Getting location..." : "Use my location"}
          </Button>
        )}
      </div>

      {/* Clear all */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClearAll}
        className="w-full text-muted-foreground"
      >
        Clear all filters
      </Button>
    </div>
  );
}

export function FilterSidebar(props: FilterSidebarProps) {
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
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <FilterContent {...props} />
      </aside>

      {/* Mobile sheet trigger */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 size-5 rounded-full p-0 text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto p-6">
            <SheetHeader className="p-0 pb-4">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <FilterContent {...props} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
