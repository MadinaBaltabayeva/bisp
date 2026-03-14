"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, Star, Shield, Zap } from "lucide-react";

export function HeroSection() {
  const t = useTranslations("HomePage");
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/browse?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/browse");
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700">
      {/* Abstract pattern background */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 size-[500px] rounded-full bg-orange-400/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-[400px] rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-yellow-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            <Zap className="size-4" />
            <span>Peer-to-peer rentals in your neighborhood</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-amber-100/90">
            {t("hero.subtitle")}
          </p>

          {/* Search bar — the main focal point */}
          <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-2xl">
            <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-orange-900/20">
              <div className="flex flex-1 items-center gap-3 px-4">
                <Search className="size-5 shrink-0 text-stone-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What do you need? Try 'camera', 'drill', 'tent'..."
                  className="w-full bg-transparent py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="rounded-xl bg-amber-600 px-6 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/30"
              >
                {t("hero.browseItems")}
                <ArrowRight className="ml-1 size-4" />
              </Button>
            </div>
          </form>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-amber-100/80">
            <div className="flex items-center gap-1.5">
              <Shield className="size-4" />
              <span>AI-verified listings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="size-4" />
              <span>Rated owners</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="size-4" />
              <span>Instant messaging</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
