import { Users, Package, Calendar, ShieldAlert } from "lucide-react";
import { getAdminStats, getActivityFeed } from "@/features/admin/queries";
import { StatCard } from "@/components/admin/stat-card";
import { ActivityFeed } from "@/components/admin/activity-feed";

export default async function AdminDashboardPage() {
  const [stats, feed] = await Promise.all([
    getAdminStats(),
    getActivityFeed(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Platform overview and recent activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Active Listings"
          value={stats.totalListings}
          icon={Package}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Total Rentals"
          value={stats.totalRentals}
          icon={Calendar}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Flagged Content"
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
