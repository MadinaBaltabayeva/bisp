"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ArrowRight, Search, TrendingUp } from "lucide-react";
import { type FormEvent, useState } from "react";
import { LANDING_HERO } from "./assets";

export function HeroSection() {
  const t = useTranslations("HomePage.hero");
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/browse?q=${encodeURIComponent(trimmed)}` : "/browse");
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-pink-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 60% at 100% 0%, rgba(244,114,182,0.18) 0%, transparent 60%), radial-gradient(60% 60% at 0% 0%, rgba(251,146,60,0.18) 0%, transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left: content */}
          <div>
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
              {t.rich("titleLine1", {
                accent1: (chunks) => (
                  <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                    {chunks}
                  </span>
                ),
              })}
              <br />
              {t.rich("titleLine2", {
                accent2: (chunks) => (
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    {chunks}
                  </span>
                ),
              })}
            </h1>

            <p className="mt-6 max-w-md text-lg leading-relaxed text-stone-600">
              {t("subtitle")}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 max-w-md" role="search">
              <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-stone-100">
                <div className="flex flex-1 items-center gap-2 px-3">
                  <Search aria-hidden className="size-5 shrink-0 text-stone-400" />
                  <input
                    type="search"
                    name="q"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    aria-label={t("searchPlaceholder")}
                    className="min-w-0 flex-1 bg-transparent py-2 text-stone-900 placeholder:text-stone-400 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                >
                  {t("searchAction")} <ArrowRight className="size-4" />
                </button>
              </div>
            </form>

            <div className="mt-10 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/browse")}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-medium text-white shadow-md transition-colors hover:bg-orange-600"
              >
                {t("browseItems")} <ArrowRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => router.push("/listings/new")}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-6 py-3.5 font-medium text-stone-900 shadow-sm transition-colors hover:bg-stone-50"
              >
                <TrendingUp className="size-4 text-emerald-500" />
                {t("listItems")}
              </button>
            </div>
          </div>

          {/* Right: image with floating cards */}
          <div className="relative mt-8 lg:mt-0">
            <div className="group relative isolate aspect-[4/3] w-full overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-white/40">
              <Image
                src={LANDING_HERO}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="rounded-[2rem] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
