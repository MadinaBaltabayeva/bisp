"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ArrowRight, Camera, Search, Sparkles, Star, TrendingUp, Wrench } from "lucide-react";
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
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-4 py-1.5 text-sm text-stone-700 shadow-sm backdrop-blur">
              <Sparkles className="size-4 text-orange-500" />
              <span>Join 10,000+ happy renters</span>
            </div>

            <h1 className="mt-8 text-5xl font-bold leading-[1.05] tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
              Rent{" "}
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                Anything,
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Anytime
              </span>
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
                  Search <ArrowRight className="size-4" />
                </button>
              </div>
            </form>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="size-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 ring-2 ring-white" />
                  <div className="size-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 ring-2 ring-white" />
                  <div className="size-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 ring-2 ring-white" />
                </div>
                <div>
                  <div className="font-semibold text-stone-900">10K+ Users</div>
                  <div className="flex items-center gap-1 text-sm text-stone-600">
                    <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                    4.9 rating
                  </div>
                </div>
              </div>
              <div className="border-l border-stone-200 pl-8">
                <div className="text-2xl font-bold text-stone-900">50K+</div>
                <div className="text-sm text-stone-600">Items listed</div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/browse")}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-medium text-white shadow-md transition-colors hover:bg-orange-600"
              >
                Browse Items <ArrowRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => router.push("/listings/new")}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-6 py-3.5 font-medium text-stone-900 shadow-sm transition-colors hover:bg-stone-50"
              >
                <TrendingUp className="size-4 text-emerald-500" />
                List Your Items
              </button>
            </div>
          </div>

          {/* Right: image with floating cards */}
          <div className="relative mt-8 lg:mt-0">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/40">
              <Image
                src={LANDING_HERO}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="absolute -top-3 right-6 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-xl ring-1 ring-stone-100 sm:-top-4 sm:right-10">
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500 text-white">
                <Camera className="size-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Camera Gear</div>
                <div className="text-xs text-stone-500">$25/day</div>
              </div>
            </div>

            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 rounded-2xl bg-orange-500 px-5 py-3 text-white shadow-xl sm:translate-x-3">
              <div className="text-2xl font-bold leading-none">2.5K+</div>
              <div className="mt-1 text-xs">Verified Users</div>
            </div>

            <div className="absolute -bottom-3 left-4 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-xl ring-1 ring-stone-100 sm:-bottom-4 sm:left-8">
              <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <Wrench className="size-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Power Tools</div>
                <div className="text-xs text-stone-500">$15/day</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
