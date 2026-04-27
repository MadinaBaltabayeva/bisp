"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

const STEPS = [
  { num: 1, color: "bg-orange-500", titleKey: "step1.title", bodyKey: "step1.body" },
  { num: 2, color: "bg-blue-500", titleKey: "step2.title", bodyKey: "step2.body" },
  { num: 3, color: "bg-emerald-500", titleKey: "step3.title", bodyKey: "step3.body" },
] as const;

export function HowItWorks() {
  const t = useTranslations("HomePage.howItWorks");

  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-stone-600">{t("subtitle")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 md:gap-4">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative flex">
              <div className="flex w-full flex-col items-center rounded-2xl bg-white p-8 text-center shadow-sm">
                <div
                  className={`flex size-14 items-center justify-center rounded-full ${step.color} text-xl font-bold text-white shadow-md`}
                >
                  {step.num}
                </div>
                <h3 className="mt-6 text-lg font-bold text-stone-900">
                  {t(step.titleKey as Parameters<typeof t>[0])}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  {t(step.bodyKey as Parameters<typeof t>[0])}
                </p>
              </div>

              {i < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 md:block"
                >
                  <ArrowRight className="size-6 text-stone-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
