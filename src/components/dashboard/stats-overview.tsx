import { DollarSign, Package, TrendingUp, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsOverviewProps {
  stats: {
    totalRevenue: number;
    activeListings: number;
    completedRentals: number;
    bookingRate: number;
    averageRating: number;
    reviewCount: number;
  };
  translations: {
    revenue: string;
    activeListings: string;
    completedRentals: string;
    bookingRate: string;
  };
}

const STAT_CARDS = [
  {
    key: "revenue" as const,
    icon: DollarSign,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
    format: (v: number) => `$${v.toLocaleString()}`,
    statKey: "totalRevenue" as const,
  },
  {
    key: "activeListings" as const,
    icon: Package,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    format: (v: number) => String(v),
    statKey: "activeListings" as const,
  },
  {
    key: "completedRentals" as const,
    icon: TrendingUp,
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
    format: (v: number) => String(v),
    statKey: "completedRentals" as const,
  },
  {
    key: "bookingRate" as const,
    icon: Star,
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
    format: (v: number) => `${v}%`,
    statKey: "bookingRate" as const,
  },
] as const;

export function StatsOverview({ stats, translations }: StatsOverviewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STAT_CARDS.map((card) => (
        <Card key={card.key}>
          <CardContent className="flex items-center gap-4 pt-6">
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-full ${card.bgColor}`}
            >
              <card.icon className={`size-6 ${card.iconColor}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {translations[card.key]}
              </p>
              <p className="text-2xl font-bold">
                {card.format(stats[card.statKey])}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
