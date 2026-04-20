"use client";

import { useTranslations } from "next-intl";

export function HowItWorks() {
  const t = useTranslations("HomePage.howItWorks");

  const steps = [
    { num: "01", titleKey: "step1.title", bodyKey: "step1.body" },
    { num: "02", titleKey: "step2.title", bodyKey: "step2.body" },
    { num: "03", titleKey: "step3.title", bodyKey: "step3.body" },
  ] as const;

  return (
    <section className="border-t border-stone-200/70 bg-stone-100/60">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="mb-10 font-serif text-2xl font-medium tracking-tight text-stone-900 sm:text-[26px]">
          {t("title")}
        </h2>
        <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map((step) => (
            <div key={step.num}>
              <div className="font-serif text-3xl font-medium text-primary-700">
                {step.num}
              </div>
              <h3 className="mt-2 text-[17px] font-semibold text-stone-900">
                {t(step.titleKey as Parameters<typeof t>[0])}
              </h3>
              <p className="mt-1 text-[15px] leading-relaxed text-stone-600">
                {t(step.bodyKey as Parameters<typeof t>[0])}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
