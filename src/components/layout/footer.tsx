"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="hidden border-t border-stone-200 bg-stone-50 md:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 text-[12px] text-stone-500 sm:px-6 lg:px-8">
        <span>© {year} RentHub</span>
        <span>{t("tagline")}</span>
      </div>
    </footer>
  );
}
