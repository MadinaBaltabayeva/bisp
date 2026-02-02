import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getFlaggedListings } from "@/features/admin/queries";
import { ModerationQueue } from "@/components/admin/moderation-queue";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("adminModeration.title"),
    description: t("adminModeration.description"),
  };
}

export default async function AdminModerationPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [flaggedListings, t] = await Promise.all([
    getFlaggedListings(),
    getTranslations("Admin.moderation"),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("pendingCount", { count: flaggedListings.length })}
        </p>
      </div>

      {/* Moderation Content */}
      <ModerationQueue listings={flaggedListings} />
    </div>
  );
}
