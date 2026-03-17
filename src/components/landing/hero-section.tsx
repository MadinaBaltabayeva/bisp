"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, ShieldCheck, Users, Star } from "lucide-react";

export function HeroSection() {
  const t = useTranslations("HomePage");
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-primary-700 to-orange-800">
      {/* Decorative background circles */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white" />
        <div className="absolute -bottom-32 -left-32 size-80 rounded-full bg-white" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-amber-100 sm:text-xl">
            {t("hero.subtitle")}
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-10 max-w-2xl">
            <Link
              href="/#categories"
              className="flex items-center gap-3 rounded-2xl bg-white/95 px-5 py-4 shadow-warm-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-warm-xl"
            >
              <Search className="size-5 shrink-0 text-primary-600" />
              <span className="text-left text-base text-stone-400">
                {t("hero.browseItems")}
              </span>
              <span className="ml-auto hidden shrink-0 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 sm:inline-block">
                {t("hero.listYourItem")}
              </span>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-amber-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              <span>Verified Users</span>
            </div>
            <div className="hidden h-4 w-px bg-amber-200/30 sm:block" />
            <div className="flex items-center gap-2">
              <Users className="size-4" />
              <span>Active Community</span>
            </div>
            <div className="hidden h-4 w-px bg-amber-200/30 sm:block" />
            <div className="flex items-center gap-2">
              <Star className="size-4" />
              <span>Top Rated</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
