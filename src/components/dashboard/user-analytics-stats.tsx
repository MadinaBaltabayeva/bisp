import { Eye, Search, UserCheck, Heart, MousePointerClick, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface UserAnalyticsStatsProps {
  stats: {
    totalViews: number;
    totalImpressions: number;
    profileViews: number;
    totalFavorites: number;
    overallCtr: number;
    conversionRate: number;
    completionRate: number;
  };
  responseTime: number | null;
  translations: {
    totalViews: string;
    searchAppearances: string;
    profileViews: string;
    totalFavorites: string;
    clickThrough: string;
    conversionRate: string;
    avgResponseTime: string;
    minutes: string;
    noData: string;
  };
}

const STAT_ITEMS = [
  { key: "totalViews" as const, stat: "totalViews" as const, icon: Eye, bg: "bg-blue-100", color: "text-blue-600", format: (v: number) => String(v) },
  { key: "searchAppearances" as const, stat: "totalImpressions" as const, icon: Search, bg: "bg-purple-100", color: "text-purple-600", format: (v: number) => String(v) },
  { key: "profileViews" as const, stat: "profileViews" as const, icon: UserCheck, bg: "bg-cyan-100", color: "text-cyan-600", format: (v: number) => String(v) },
  { key: "totalFavorites" as const, stat: "totalFavorites" as const, icon: Heart, bg: "bg-rose-100", color: "text-rose-600", format: (v: number) => String(v) },
  { key: "clickThrough" as const, stat: "overallCtr" as const, icon: MousePointerClick, bg: "bg-amber-100", color: "text-amber-600", format: (v: number) => `${v}%` },
  { key: "conversionRate" as const, stat: "conversionRate" as const, icon: TrendingUp, bg: "bg-green-100", color: "text-green-600", format: (v: number) => `${v}%` },
] as const;

export function UserAnalyticsStats({ stats, responseTime, translations }: UserAnalyticsStatsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {STAT_ITEMS.map((item) => (
        <Card key={item.key}>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", item.bg)}>
              <item.icon className={cn("size-5", item.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold">{item.format(stats[item.stat])}</p>
              <p className="text-xs text-muted-foreground">{translations[item.key]}</p>
            </div>
          </CardContent>
        </Card>
      ))}
      {/* Response time card */}
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100">
            <Clock className="size-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {responseTime !== null ? `${responseTime}m` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">{translations.avgResponseTime}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
