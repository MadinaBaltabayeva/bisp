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

const CATEGORY_STYLES: Record<string, { gradient: string; iconBg: string }> = {
  tools: { gradient: "from-amber-400 to-amber-600", iconBg: "bg-amber-500/20" },
  electronics: { gradient: "from-sky-400 to-sky-600", iconBg: "bg-sky-500/20" },
  sports: { gradient: "from-green-400 to-green-600", iconBg: "bg-green-500/20" },
  outdoor: { gradient: "from-emerald-400 to-emerald-600", iconBg: "bg-emerald-500/20" },
  vehicles: { gradient: "from-red-400 to-red-600", iconBg: "bg-red-500/20" },
  clothing: { gradient: "from-pink-400 to-pink-600", iconBg: "bg-pink-500/20" },
  music: { gradient: "from-purple-400 to-purple-600", iconBg: "bg-purple-500/20" },
  "home-garden": { gradient: "from-orange-400 to-orange-600", iconBg: "bg-orange-500/20" },
};

export function CategoryGrid() {
  const tHome = useTranslations("HomePage");
  const tCat = useTranslations("Categories");

  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 sm:text-3xl tracking-tight">
            {tHome("categories.title")}
          </h2>
          <p className="mt-1 text-stone-500">{tHome("categories.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
        {CATEGORIES.map((category) => {
          const IconComponent = ICON_MAP[category.icon] || Home;
          const translationKey = SLUG_TO_KEY[category.slug] || category.slug;
          const style = CATEGORY_STYLES[category.slug] || CATEGORY_STYLES.tools;

          return (
            <Link key={category.slug} href={`/browse?category=${category.slug}`}>
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-100`} />
                <div className="relative">
                  <div className={`mb-3 inline-flex size-12 items-center justify-center rounded-xl ${style.iconBg} backdrop-blur-sm`}>
                    <IconComponent className="size-6 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-white sm:text-base">
                    {tCat(translationKey as Parameters<typeof tCat>[0])}
                  </h3>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
