import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getSession } from "@/features/auth/queries";
import { redirect } from "next/navigation";
import {
  getOwnerStats,
  getMonthlyRevenue,
  getTopListings,
} from "@/features/analytics/queries";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TopListings } from "@/components/dashboard/top-listings";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { BarChart3 } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("dashboard.title"),
    description: t("dashboard.description"),
  };
}

export default async function DashboardPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [session, t] = await Promise.all([
    getSession(),
    getTranslations("Dashboard"),
  ]);

  if (!session) redirect(`/${locale}/`);

  const [stats, monthlyRevenue, topListings] = await Promise.all([
    getOwnerStats(session.user.id),
    getMonthlyRevenue(session.user.id),
    getTopListings(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/analytics">
            <BarChart3 className="mr-2 size-4" />
            {t("detailedAnalytics")}
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <StatsOverview
          stats={stats}
          translations={{
            revenue: t("revenue"),
            activeListings: t("activeListings"),
            completedRentals: t("completedRentals"),
            bookingRate: t("bookingRate"),
          }}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart data={monthlyRevenue} />
          <TopListings
            listings={topListings}
            translations={{
              title: t("topListings"),
              rentals: t("rentals"),
              favorites: t("favorites"),
              noListings: t("noListingsYet"),
            }}
          />
        </div>
      </div>
    </div>
  );
}
