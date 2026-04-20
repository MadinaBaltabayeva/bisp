"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CATEGORIES } from "@/features/seed/categories";

const FOOTER_CATEGORY_SLUGS = [
  "tools",
  "electronics",
  "sports",
  "outdoor",
  "vehicles",
  "music",
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

export function Footer() {
  const t = useTranslations("Footer");
  const tCat = useTranslations("Categories");
  const year = new Date().getFullYear();

  const featuredCategories = FOOTER_CATEGORY_SLUGS
    .map((slug) => CATEGORIES.find((c) => c.slug === slug))
    .filter((c): c is (typeof CATEGORIES)[number] => Boolean(c));

  return (
    <footer className="hidden border-t border-stone-200 bg-stone-50 md:block">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-5">
            <div className="font-serif text-xl font-medium text-stone-900">RentHub</div>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-stone-600">
              {t("tagline")}
            </p>
          </div>

          <div className="col-span-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-stone-500">
              {t("browse")}
            </div>
            <ul className="mt-4 space-y-2 text-[13px] text-stone-700">
              <li>
                <Link href="/browse" className="hover:text-stone-900 hover:underline underline-offset-4">
                  {t("allItems")}
                </Link>
              </li>
              {featuredCategories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/browse?category=${category.slug}`}
                    className="hover:text-stone-900 hover:underline underline-offset-4"
                  >
                    {tCat(SLUG_TO_KEY[category.slug] as Parameters<typeof tCat>[0])}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-stone-500">
              {t("about")}
            </div>
            <ul className="mt-4 space-y-2 text-[13px] text-stone-700">
              <li>
                <Link href="/#categories" className="hover:text-stone-900 hover:underline underline-offset-4">
                  {t("howItWorks")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-stone-200 pt-5 text-[12px] text-stone-500">
          <span>© {year} RentHub</span>
          <span>{t("madeFor")}</span>
        </div>
      </div>
    </footer>
  );
}
