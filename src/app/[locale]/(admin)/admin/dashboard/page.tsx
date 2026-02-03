import { Users, Package, Calendar, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getAdminStats, getActivityFeed } from "@/features/admin/queries";
import { StatCard } from "@/components/admin/stat-card";
import { ActivityFeed } from "@/components/admin/activity-feed";

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
    title: t("adminDashboard.title"),
    description: t("adminDashboard.description"),
  };
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as (typeof routing.locales)[number];
  setRequestLocale(locale);

  const [stats, feed, t] = await Promise.all([
    getAdminStats(),
    getActivityFeed(),
    getTranslations("Admin.dashboard"),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("totalUsers")}
          value={stats.totalUsers}
          icon={Users}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title={t("activeListings")}
          value={stats.totalListings}
          icon={Package}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title={t("totalRentals")}
          value={stats.totalRentals}
          icon={Calendar}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          title={t("flaggedContent")}
          value={stats.flaggedCount}
          icon={ShieldAlert}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* Activity Feed */}
      <ActivityFeed items={feed} />
    </div>
  );
}
