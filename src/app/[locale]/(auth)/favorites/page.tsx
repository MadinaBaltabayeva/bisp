import { Heart } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

import { getSession } from "@/features/auth/queries";
import { getFavoriteListings, getUserFavoriteIds } from "@/features/favorites/queries";
import { ListingCard } from "@/components/listings/listing-card";

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
    title: t("favorites.title"),
    description: t("favorites.description"),
  };
}

export default async function FavoritesPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [session, t] = await Promise.all([
    getSession(),
    getTranslations("Favorites"),
  ]);

  if (!session) return null;

  const [favorites, favoriteIds] = await Promise.all([
    getFavoriteListings(session.user.id),
    getUserFavoriteIds(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <div className="mb-4 rounded-full bg-muted p-3">
            <Heart className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-gray-900">{t("empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("emptyDescription")}
          </p>
          <Link
            href="/"
            className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {t("browseListings")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((favorite) => (
            <ListingCard
              key={favorite.id}
              listing={favorite.listing}
              isFavorited={favoriteIds.has(favorite.listing.id)}
              isAuthenticated={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
