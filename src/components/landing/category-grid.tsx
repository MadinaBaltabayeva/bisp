"use client";

import { useTranslations } from "next-intl";
import {
  Bike,
  Car,
  Camera,
  Home,
  Music as MusicIcon,
  Shirt,
  Tent,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CATEGORIES } from "@/features/seed/categories";

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

const STYLES: Record<
  string,
  { card: string; iconWrap: string; icon: string; Icon: LucideIcon }
> = {
  electronics: {
    card: "bg-orange-50",
    iconWrap: "bg-white",
    icon: "text-orange-500",
    Icon: Camera,
  },
  vehicles: {
    card: "bg-blue-50",
    iconWrap: "bg-white",
    icon: "text-blue-500",
    Icon: Car,
  },
  tools: {
    card: "bg-emerald-50",
    iconWrap: "bg-white",
    icon: "text-emerald-500",
    Icon: Wrench,
  },
  "home-garden": {
    card: "bg-purple-50",
    iconWrap: "bg-white",
    icon: "text-purple-500",
    Icon: Home,
  },
  music: {
    card: "bg-pink-50",
    iconWrap: "bg-white",
    icon: "text-pink-500",
    Icon: MusicIcon,
  },
  sports: {
    card: "bg-cyan-50",
    iconWrap: "bg-white",
    icon: "text-cyan-500",
    Icon: Bike,
  },
  outdoor: {
    card: "bg-indigo-50",
    iconWrap: "bg-white",
    icon: "text-indigo-500",
    Icon: Tent,
  },
  clothing: {
    card: "bg-amber-50",
    iconWrap: "bg-white",
    icon: "text-amber-500",
    Icon: Shirt,
  },
};

export function CategoryGrid() {
  const tCat = useTranslations("Categories");
  const tHome = useTranslations("HomePage.categories");

  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          {tHome("title")}
        </h2>
        <p className="mt-3 text-stone-600">{tHome("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {CATEGORIES.map((category) => {
          const style = STYLES[category.slug];
          if (!style) return null;
          const { card, iconWrap, icon, Icon } = style;
          const translationKey = SLUG_TO_KEY[category.slug] ?? category.slug;

          return (
            <Link
              key={category.slug}
              href={`/browse?category=${category.slug}`}
              className={`group flex flex-col items-center justify-center gap-4 rounded-2xl ${card} p-6 transition-transform hover:-translate-y-1 hover:shadow-lg`}
            >
              <div className={`flex size-14 items-center justify-center rounded-2xl ${iconWrap} shadow-sm`}>
                <Icon className={`size-7 ${icon}`} />
              </div>
              <span className="text-base font-semibold text-stone-900">
                {tCat(translationKey as Parameters<typeof tCat>[0])}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
