"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="hidden border-t border-stone-200 bg-stone-50 md:block">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-8">
          <div>
            <div className="font-serif text-lg font-medium text-stone-900">RentHub</div>
            <p className="mt-1 text-[12px] text-stone-500">{t("tagline")}</p>
          </div>
          <nav className="flex items-center gap-6 pt-1 text-[13px] text-stone-700">
            <Link href="/browse" className="hover:text-stone-900 hover:underline underline-offset-4">
              {t("allItems")}
            </Link>
            <Link href="/#categories" className="hover:text-stone-900 hover:underline underline-offset-4">
              {t("howItWorks")}
            </Link>
          </nav>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-stone-200/70 pt-4 text-[11px] text-stone-500">
          <span>© {year} RentHub</span>
          <span>{t("madeFor")}</span>
        </div>
      </div>
    </footer>
  );
}
