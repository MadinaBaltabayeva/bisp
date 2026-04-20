"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const LOCALE_NAMES: Record<string, string> = {
  uz: "O\u02BBzbekcha",
  ru: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
  en: "English",
};

const LOCALE_CODES: Record<string, string> = {
  uz: "UZ",
  ru: "RU",
  en: "EN",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function switchLocale(nextLocale: (typeof routing.locales)[number]) {
    router.replace({ pathname }, { locale: nextLocale });
  }

  const code = LOCALE_CODES[locale] ?? locale.toUpperCase();

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="gap-1.5" disabled aria-hidden>
        <Globe className="size-4" />
        <span className="text-xs font-medium">{code}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Globe className="size-4" />
          <span className="text-xs font-medium">{code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchLocale(loc)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{LOCALE_NAMES[loc]}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {LOCALE_CODES[loc]}
              </span>
            </div>
            {locale === loc && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
