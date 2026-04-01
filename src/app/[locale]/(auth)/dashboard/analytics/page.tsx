import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getSession } from "@/features/auth/queries";
import { redirect } from "next/navigation";
import {
  getUserAnalyticsStats,
  getListingAnalytics,
  getAverageResponseTime,
  getViewsOverTime,
  getMostPopularListing,
} from "@/features/analytics/user-queries";
import { UserAnalyticsStats } from "@/components/dashboard/user-analytics-stats";
import { ViewsChart } from "@/components/dashboard/views-chart";
import { ListingAnalyticsTable } from "@/components/dashboard/listing-analytics-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { ArrowLeft, Trophy } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  const t = await getTranslations({ locale, namespace: "UserAnalytics" });
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default async function UserAnalyticsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [session, t] = await Promise.all([
    getSession(),
    getTranslations("UserAnalytics"),
  ]);

  if (!session) redirect(`/${locale}/`);

  const userId = session.user.id;

  const [stats, listingData, responseTime, viewsData, popularListing] = await Promise.all([
    getUserAnalyticsStats(userId),
    getListingAnalytics(userId),
    getAverageResponseTime(userId),
    getViewsOverTime(userId),
    getMostPopularListing(userId),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="size-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 size-4" />
            {t("backToDashboard")}
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="mb-6">
        <UserAnalyticsStats
          stats={stats}
          responseTime={responseTime}
          translations={{
            totalViews: t("totalViews"),
            searchAppearances: t("searchAppearances"),
            profileViews: t("profileViews"),
            totalFavorites: t("totalFavorites"),
            clickThrough: t("clickThrough"),
            conversionRate: t("conversionRate"),
            avgResponseTime: t("avgResponseTime"),
            minutes: t("minutes"),
            noData: t("noData"),
          }}
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <ViewsChart data={viewsData} />

        {/* Most Popular Listing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5" />
              {t("mostPopular")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularListing ? (
              <Link
                href={`/listings/${popularListing.id}`}
                className="flex items-center gap-4 rounded-lg p-4 transition-colors hover:bg-muted"
              >
                {popularListing.coverImage ? (
                  <Image
                    src={popularListing.coverImage}
                    alt={popularListing.title}
                    width={80}
                    height={80}
                    className="size-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="size-20 rounded-lg bg-muted" />
                )}
                <div>
                  <p className="text-lg font-semibold">{popularListing.title}</p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {popularListing.views}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("totalViews")}</p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("noData")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-Listing Table */}
      <ListingAnalyticsTable
        data={listingData}
        translations={{
          title: t("listingPerformance"),
          listing: t("listing"),
          views: t("views"),
          appearances: t("appearances"),
          ctr: t("ctr"),
          favorites: t("favorites"),
          rentals: t("rentals"),
          inquiries: t("inquiries"),
          noListings: t("noListings"),
        }}
      />
    </div>
  );
}
