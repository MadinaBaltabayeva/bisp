import { Link } from "@/i18n/navigation";
import { ShoppingBag } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

import { HeroSection } from "@/components/landing/hero-section";
import { CategoryGrid } from "@/components/landing/category-grid";
import { ListingCard } from "@/components/listings/listing-card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getPopularListings() {
  return prisma.listing.findMany({
    where: { status: "active" },
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      images: {
        where: { isCover: true },
        take: 1,
      },
      category: true,
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          idVerified: true,
        },
      },
    },
  });
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as (typeof routing.locales)[number]);
  const t = await getTranslations("HomePage");
  const listings = await getPopularListings();

  return (
    <>
      <HeroSection />
      <CategoryGrid />

      {/* Popular Items */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {t("popular.title")}
          </h2>
          {listings.length > 0 && (
            <Link
              href="/browse"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t("popular.viewAll")}
            </Link>
          )}
        </div>

        {listings.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 py-16 text-gray-400">
            <ShoppingBag className="size-10" />
            <p className="text-sm">{t("popular.comingSoon")}</p>
          </div>
        )}
      </section>
    </>
  );
}
