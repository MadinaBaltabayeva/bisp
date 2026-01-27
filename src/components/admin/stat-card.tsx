import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  trend?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconBgColor = "bg-blue-100",
  iconColor = "text-blue-600",
  trend,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full",
            iconBgColor
          )}
        >
          <Icon className={cn("size-6", iconColor)} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <p className="text-xs text-muted-foreground mt-0.5">{trend}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
