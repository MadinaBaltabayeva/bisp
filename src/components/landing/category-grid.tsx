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
import { cn } from "@/lib/utils";

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

const CATEGORY_GRADIENTS: Record<string, string> = {
  tools: "from-orange-500 to-amber-600",
  electronics: "from-blue-500 to-indigo-600",
  sports: "from-green-500 to-emerald-600",
  outdoor: "from-teal-500 to-cyan-600",
  vehicles: "from-red-500 to-rose-600",
  clothing: "from-pink-500 to-fuchsia-600",
  music: "from-purple-500 to-violet-600",
  "home-garden": "from-lime-500 to-green-600",
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

          return (
            <Link key={category.slug} href={`/browse?category=${category.slug}`}>
              <div className={cn(
                "group relative flex h-32 flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br p-4 text-center transition-all hover:-translate-y-1 hover:shadow-warm-lg sm:h-36",
                CATEGORY_GRADIENTS[category.slug] || "from-stone-500 to-stone-600"
              )}>
                <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110">
                  <IconComponent className="size-6 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {tCat(translationKey as Parameters<typeof tCat>[0])}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
