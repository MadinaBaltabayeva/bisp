import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import {
  parsePeriod,
  getAnalyticsKPIs,
  getUserGrowthData,
  getRentalVolumeData,
  getRevenueTrendData,
  getCategoryBreakdown,
  getTopEarners,
  getConversionFunnel,
} from "@/features/analytics/admin-queries";
import { KPICards } from "@/components/admin/analytics/kpi-cards";
import { UserGrowthChart } from "@/components/admin/analytics/user-growth-chart";
import { RentalVolumeChart } from "@/components/admin/analytics/rental-volume-chart";
import { RevenueTrendChart } from "@/components/admin/analytics/revenue-trend-chart";
import { CategoryBreakdownChart } from "@/components/admin/analytics/category-breakdown-chart";
import { TopEarnersTable } from "@/components/admin/analytics/top-earners-table";
import { ConversionFunnel } from "@/components/admin/analytics/conversion-funnel";
import { PeriodSelector } from "@/components/admin/analytics/period-selector";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("adminAnalytics.title"),
    description: t("adminAnalytics.description"),
  };
}

export default async function AdminAnalyticsPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const sp = await searchParams;
  const range = parsePeriod(sp.period, sp.from, sp.to);

  const [t, kpis, userGrowth, rentalVolume, revenueTrend, categoryBreakdown, topEarners, funnel] =
    await Promise.all([
      getTranslations("Admin.analytics"),
      getAnalyticsKPIs(range),
      getUserGrowthData(range),
      getRentalVolumeData(range),
      getRevenueTrendData(range),
      getCategoryBreakdown(range),
      getTopEarners(range),
      getConversionFunnel(range),
    ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="size-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <PeriodSelector />
      </div>

      {/* KPI Cards */}
      <KPICards
        data={kpis}
        translations={{
          newUsers: t("newUsers"),
          newListings: t("newListings"),
          totalRentals: t("totalRentals"),
          revenue: t("revenue"),
          avgRating: t("avgRating"),
          completionRate: t("completionRate"),
          vsPrevious: t("vsPrevious"),
        }}
      />

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UserGrowthChart data={userGrowth} />
        <RentalVolumeChart data={rentalVolume} />
        <RevenueTrendChart data={revenueTrend} />
        <CategoryBreakdownChart data={categoryBreakdown} />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopEarnersTable data={topEarners} />
        <ConversionFunnel data={funnel} />
      </div>
    </div>
  );
}
