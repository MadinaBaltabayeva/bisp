import { Link } from "@/i18n/navigation";
import { ShoppingBag } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

import { HeroSection } from "@/components/landing/hero-section";
import { CategoryGrid } from "@/components/landing/category-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ListingCard } from "@/components/listings/listing-card";
import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/queries";
import { getUserFavoriteIds } from "@/features/favorites/queries";

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

  const [listings, session] = await Promise.all([
    getPopularListings(),
    getSession(),
  ]);

  let favoriteIds: Set<string> = new Set();
  if (session) {
    favoriteIds = await getUserFavoriteIds(session.user.id);
  }

  return (
    <>
      <HeroSection />
      <CategoryGrid />

      <section className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 lg:px-8">
        <div className="border-t border-stone-200 pt-10">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-stone-900 sm:text-[26px]">
              {t("popular.title")}
            </h2>
            {listings.length > 0 && (
              <Link
                href="/browse"
                className="text-xs text-stone-600 underline-offset-4 hover:underline"
              >
                {t("popular.viewAll")}
              </Link>
            )}
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorited={favoriteIds.has(listing.id)}
                  isAuthenticated={!!session}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-stone-400">
              <ShoppingBag className="size-10" />
              <p className="text-sm">{t("popular.comingSoon")}</p>
            </div>
          )}
        </div>
      </section>

      <HowItWorks />
    </>
  );
}
