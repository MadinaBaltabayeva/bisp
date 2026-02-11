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
  descriptionHeading,
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
      {/* Banner / link area */}
      {!sameLanguage && !showTranslated && !isPending && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <Languages className="size-4 shrink-0" />
            {translation ? (
              <span>
                {t("banner", {
                  language: getLanguageName(translation.detectedLanguage),
                })}
              </span>
            ) : (
              <span>
                {t("translateTo", {
                  targetLanguage: getLocaleLanguageName(),
                })}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTranslate}
            className="ml-3 shrink-0 border-blue-300 text-blue-800 hover:bg-blue-100"
          >
            {t("translate")}
          </Button>
        </div>
      )}

      {/* Loading banner */}
      {isPending && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Languages className="size-4 shrink-0 animate-pulse" />
          <span>{t("translating")}</span>
        </div>
      )}

      {/* Translated from link */}
      {showTranslated && translation && !sameLanguage && (
        <div className="mt-6 flex items-center gap-1 text-xs text-muted-foreground">
          <Languages className="size-3 shrink-0" />
          <span>
            {t("translatedFrom", {
              language: getLanguageName(translation.detectedLanguage),
            })}
          </span>
          <span>&mdash;</span>
          <button
            type="button"
            onClick={handleShowOriginal}
            className="underline hover:text-foreground transition-colors"
          >
            {t("showOriginal")}
          </button>
        </div>
      )}

      {/* Title */}
      {isPending ? (
        <div className="mt-6">
          <Skeleton className="h-8 w-3/4" />
        </div>
      ) : (
        <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl">
          {displayTitle}
        </h1>
      )}

      {/* Children slot (badges, tags, mobile price card) */}
      {children}

      {/* Description */}
      {isPending ? (
        <div className="mt-8 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">
            {descriptionHeading}
          </h2>
          <p className="mt-2 whitespace-pre-line text-gray-600 leading-relaxed">
            {displayDescription}
          </p>
        </div>
      )}
    </>
  );
}
