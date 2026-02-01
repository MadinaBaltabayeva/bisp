import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/queries";
import { getListingById } from "@/features/listings/queries";
import { ListingForm } from "@/components/listings/listing-form";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("editListing.title"),
    description: t("editListing.description"),
  };
}

export default async function EditListingPage({ params }: PageProps) {
  const { id, locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [session, t] = await Promise.all([
    getSession(),
    getTranslations("Listings.form"),
  ]);

  if (!session) {
    redirect("/");
  }

  const listing = await getListingById(id);
  if (!listing) {
    notFound();
  }

  // Verify ownership
  if (listing.ownerId !== session.user.id) {
    redirect(`/listings/${id}`);
  }

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const listingData = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    categoryId: listing.categoryId,
    condition: listing.condition,
    priceHourly: listing.priceHourly,
    priceDaily: listing.priceDaily,
    priceWeekly: listing.priceWeekly,
    priceMonthly: listing.priceMonthly,
    location: listing.location,
    region: listing.region,
    latitude: listing.latitude,
    longitude: listing.longitude,
    tags: listing.tags,
    images: listing.images.map((img) => ({
      id: img.id,
      url: img.url,
      isCover: img.isCover,
    })),
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("editListingTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("editListingDescription")}
        </p>
      </div>
      <ListingForm
        mode="edit"
        listing={listingData}
        categories={categories}
      />
    </div>
  );
}
