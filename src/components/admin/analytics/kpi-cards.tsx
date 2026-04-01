import {
  Users,
  Package,
  Calendar,
  DollarSign,
  Star,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPIValue {
  value: number;
  trend: number | null;
}

interface KPICardsProps {
  data: {
    newUsers: KPIValue;
    newListings: KPIValue;
    totalRentals: KPIValue;
    revenue: KPIValue;
    avgRating: KPIValue;
    completionRate: KPIValue;
  };
  translations: {
    newUsers: string;
    newListings: string;
    totalRentals: string;
    revenue: string;
    avgRating: string;
    completionRate: string;
    vsPrevious: string;
  };
}

const CARDS = [
  { key: "newUsers" as const, icon: Users, bg: "bg-blue-100", color: "text-blue-600", format: (v: number) => String(v) },
  { key: "newListings" as const, icon: Package, bg: "bg-green-100", color: "text-green-600", format: (v: number) => String(v) },
  { key: "totalRentals" as const, icon: Calendar, bg: "bg-purple-100", color: "text-purple-600", format: (v: number) => String(v) },
  { key: "revenue" as const, icon: DollarSign, bg: "bg-emerald-100", color: "text-emerald-600", format: (v: number) => `$${v.toLocaleString()}` },
  { key: "avgRating" as const, icon: Star, bg: "bg-amber-100", color: "text-amber-600", format: (v: number) => v.toFixed(1) },
  { key: "completionRate" as const, icon: CheckCircle, bg: "bg-rose-100", color: "text-rose-600", format: (v: number) => `${v}%` },
] as const;

export function KPICards({ data, translations }: KPICardsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
      {CARDS.map((card) => {
        const kpi = data[card.key];
        return (
          <Card key={card.key}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", card.bg)}>
                  <card.icon className={cn("size-5", card.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.format(kpi.value)}</p>
              <p className="text-sm text-muted-foreground mt-1">{translations[card.key]}</p>
              {kpi.trend !== null && (
                <div className={cn(
                  "flex items-center gap-1 text-xs mt-2 font-medium",
                  kpi.trend >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {kpi.trend >= 0 ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {kpi.trend >= 0 ? "+" : ""}{kpi.trend}% {translations.vsPrevious}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
