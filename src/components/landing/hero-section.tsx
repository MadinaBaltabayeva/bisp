"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Search } from "lucide-react";
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
    <section className="relative h-[440px] w-full overflow-hidden sm:h-[520px]">
      <Image
        src={LANDING_HERO}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Dark overlay for text legibility */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom right, rgba(20,20,18,0.55) 0%, rgba(20,20,18,0.15) 55%, rgba(20,20,18,0) 100%)",
        }}
      />

      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary-200/90">
            {t("kicker")}
          </div>
          <h1 className="mt-3 font-serif text-4xl font-normal leading-[1.05] tracking-tight sm:text-5xl lg:text-[52px]">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/90 sm:text-[15px]">
            {t("subtitle")}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 max-w-md" role="search">
            <div className="flex items-center gap-3 rounded-md bg-white px-4 py-3 text-sm text-stone-600 shadow-warm-lg transition-shadow focus-within:shadow-warm-xl hover:shadow-warm-xl">
              <Search aria-hidden className="size-4 shrink-0 text-stone-500" />
              <input
                type="search"
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-stone-900 placeholder:text-stone-400 outline-none"
              />
              <button
                type="submit"
                className="ml-auto shrink-0 rounded-sm bg-stone-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-stone-800"
              >
                {t("browseItems")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
