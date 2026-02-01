import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/db";
import { ListingForm } from "@/components/listings/listing-form";

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
    title: t("newListing.title"),
    description: t("newListing.description"),
  };
}

export default async function CreateListingPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [categories, t] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    getTranslations("Listings.form"),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("listAnItem")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("listAnItemDescription")}
        </p>
      </div>
      <ListingForm mode="create" categories={categories} />
    </div>
  );
}
