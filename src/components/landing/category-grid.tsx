"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Wrench,
  Laptop,
  Dumbbell,
  Tent,
  Car,
  Shirt,
  Music,
  Home,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES } from "@/features/seed/categories";
import { Card, CardContent } from "@/components/ui/card";

const ICON_MAP: Record<string, LucideIcon> = {
  wrench: Wrench,
  laptop: Laptop,
  dumbbell: Dumbbell,
  tent: Tent,
  car: Car,
  shirt: Shirt,
  music: Music,
  home: Home,
};

const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  tools: { bg: "bg-amber-50", icon: "text-amber-600" },
  electronics: { bg: "bg-sky-50", icon: "text-sky-600" },
  sports: { bg: "bg-green-50", icon: "text-green-600" },
  outdoor: { bg: "bg-emerald-50", icon: "text-emerald-600" },
  vehicles: { bg: "bg-red-50", icon: "text-red-600" },
  clothing: { bg: "bg-pink-50", icon: "text-pink-600" },
  music: { bg: "bg-purple-50", icon: "text-purple-600" },
  "home-garden": { bg: "bg-orange-50", icon: "text-orange-600" },
};

// Map category slugs to translation keys (slugs use kebab-case, translations use camelCase)
const SLUG_TO_KEY: Record<string, string> = {
  "tools": "tools",
  "electronics": "electronics",
  "sports": "sports",
  "outdoor": "outdoor",
  "vehicles": "vehicles",
  "clothing": "clothing",
  "music": "music",
  "home-garden": "homeGarden",
};

export function CategoryGrid() {
  const tHome = useTranslations("HomePage");
  const tCat = useTranslations("Categories");

  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold text-stone-800 sm:text-3xl">
          {tHome("categories.title")}
        </h2>
        <p className="mt-2 text-stone-500">
          {tHome("categories.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((category) => {
          const IconComponent = ICON_MAP[category.icon] || Home;
          const translationKey = SLUG_TO_KEY[category.slug] || category.slug;
          const colors = CATEGORY_COLORS[category.slug] || { bg: "bg-amber-50", icon: "text-amber-600" };

          return (
            <Link key={category.slug} href={`/browse?category=${category.slug}`}>
              <Card className="h-full border-0 shadow-warm hover:shadow-warm-md hover:-translate-y-1 transition-all duration-200">
                <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className={`flex size-14 items-center justify-center rounded-2xl ${colors.bg}`}>
                    <IconComponent className={`size-7 ${colors.icon}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {tCat(translationKey as Parameters<typeof tCat>[0])}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
