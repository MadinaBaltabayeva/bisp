"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CATEGORIES } from "@/features/seed/categories";
import { LANDING_CATEGORY_IMAGES } from "./assets";

// slugs are kebab-case, translation keys are camelCase
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

export function CategoryGrid() {
  const tHome = useTranslations("HomePage.categories");
  const tCat = useTranslations("Categories");

  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
      <div className="mb-7 flex items-baseline justify-between">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-stone-900 sm:text-[26px]">
          {tHome("title")}
        </h2>
        <span className="text-xs text-stone-500">{tHome("meta")}</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
        {CATEGORIES.map((category) => {
          const src = LANDING_CATEGORY_IMAGES[category.slug];
          const translationKey = SLUG_TO_KEY[category.slug] ?? category.slug;

          return (
            <Link
              key={category.slug}
              href={`/browse?category=${category.slug}`}
              className="group relative block overflow-hidden rounded-[4px]"
              style={{ aspectRatio: "1 / 1.15" }}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
                style={{
                  background:
                    "linear-gradient(to top, rgba(20,20,18,0.65) 0%, rgba(20,20,18,0) 100%)",
                }}
              />
              <span className="absolute left-3 bottom-2.5 text-[13px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]">
                {tCat(translationKey as Parameters<typeof tCat>[0])}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
