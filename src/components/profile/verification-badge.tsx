"use client";

import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export function VerificationBadge({ className }: { className?: string }) {
  const t = useTranslations("Verification");
  return (
    <span
      className={`inline-flex items-center gap-1 text-blue-600 ${className ?? ""}`}
    >
      <BadgeCheck className="size-4 fill-blue-600 text-white" />
      <span className="text-xs font-medium">{t("badge")}</span>
    </span>
  );
}

export function VerificationBadgeIcon({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={`size-4 fill-blue-600 text-white ${className ?? ""}`}
    />
  );
}
