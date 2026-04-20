"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { toast } from "sonner";

import { translateListing } from "@/features/listings/actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TranslationBannerProps {
  listingId: string;
  locale: string;
  originalTitle: string;
  originalDescription: string;
  descriptionHeading: string;
  cachedTranslation: {
    translatedTitle: string;
    translatedDescription: string;
    detectedLanguage: string;
  } | null;
  aiEnabled: boolean;
  children?: React.ReactNode;
}

export function TranslationBanner({
  listingId,
  locale,
  originalTitle,
  originalDescription,
  cachedTranslation,
  aiEnabled,
  children,
}: TranslationBannerProps) {
  const t = useTranslations("Translation");
  const [showTranslated, setShowTranslated] = useState(!!cachedTranslation);
  const [translation, setTranslation] = useState(cachedTranslation);
  const [sameLanguage, setSameLanguage] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!aiEnabled) return null;

  function getLanguageName(code: string): string {
    const supported = ["en", "ru", "uz"];
    if (supported.includes(code)) {
      return t(`languages.${code}` as Parameters<typeof t>[0]);
    }
    return t("languages.unknown");
  }

  function getLocaleLanguageName(): string {
    return getLanguageName(locale);
  }

  function handleTranslate() {
    startTransition(async () => {
      const result = await translateListing(listingId, locale);
      if ("error" in result) {
        toast.error(t("error"));
        return;
      }
      setTranslation(result);
      if (result.detectedLanguage === locale) {
        setSameLanguage(true);
      } else {
        setShowTranslated(true);
      }
    });
  }

  function handleShowOriginal() {
    setShowTranslated(false);
  }

  const displayTitle =
    showTranslated && translation ? translation.translatedTitle : originalTitle;
  const displayDescription =
    showTranslated && translation
      ? translation.translatedDescription
      : originalDescription;

  return (
    <>
      {/* Title — magazine serif */}
      {isPending ? (
        <div>
          <Skeleton className="h-12 w-3/4" />
        </div>
      ) : (
        <h1 className="font-serif text-4xl font-medium tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
          {displayTitle}
        </h1>
      )}

      {/* Children slot (byline, action row, tags, etc. from page.tsx) */}
      {children}

      {/* Translate prompt — quiet inline stone row, not a colored banner */}
      {!sameLanguage && !showTranslated && !isPending && (
        <div className="mt-8 flex items-center gap-3 text-[13px] text-stone-500">
          <Languages className="size-3.5 shrink-0" />
          <span>
            {translation
              ? t("banner", { language: getLanguageName(translation.detectedLanguage) })
              : t("translateTo", { targetLanguage: getLocaleLanguageName() })}
          </span>
          <button
            type="button"
            onClick={handleTranslate}
            className="text-stone-900 hover:underline underline-offset-4"
          >
            {t("translate")}
          </button>
        </div>
      )}

      {/* Loading row */}
      {isPending && (
        <div className="mt-8 flex items-center gap-3 text-[13px] text-stone-500">
          <Languages className="size-3.5 shrink-0 animate-pulse" />
          <span>{t("translating")}</span>
        </div>
      )}

      {/* Translated-from row with "Show original" toggle */}
      {showTranslated && translation && !sameLanguage && (
        <div className="mt-8 flex items-center gap-2 text-[12px] text-stone-400">
          <Languages className="size-3 shrink-0" />
          <span>
            {t("translatedFrom", { language: getLanguageName(translation.detectedLanguage) })}
          </span>
          <span aria-hidden>·</span>
          <button
            type="button"
            onClick={handleShowOriginal}
            className="hover:text-stone-700 hover:underline underline-offset-4"
          >
            {t("showOriginal")}
          </button>
        </div>
      )}

      {/* Description — magazine prose, no heading */}
      {isPending ? (
        <div className="mt-10 space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      ) : (
        <div className="mt-10">
          <p className="whitespace-pre-line text-[17px] leading-relaxed text-stone-800 sm:text-[18px]">
            {displayDescription}
          </p>
        </div>
      )}
    </>
  );
}
