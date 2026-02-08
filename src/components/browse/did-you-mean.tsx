"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Search } from "lucide-react";

interface DidYouMeanProps {
  suggestion: string;
  currentQuery: string;
}

export function DidYouMean({ suggestion }: DidYouMeanProps) {
  const t = useTranslations("Browse");
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", suggestion);
    router.push(`/browse?${params.toString()}`);
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      <div className="flex items-start gap-2">
        <Search className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <div>
          <p className="text-amber-800">
            {t.rich("didYouMean", {
              suggestion,
              link: (chunks) => (
                <button
                  type="button"
                  onClick={handleClick}
                  className="font-semibold text-amber-900 underline hover:text-amber-700"
                >
                  {chunks}
                </button>
              ),
            })}
          </p>
          <p className="mt-1 text-amber-600">{t("searchTip")}</p>
        </div>
      </div>
    </div>
  );
}
