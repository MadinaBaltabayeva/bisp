import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface FunnelStep {
  label: string;
  value: number;
  percentOfPrevious: number;
  percentOfFirst: number;
}

interface ConversionFunnelProps {
  data: FunnelStep[];
}

const BAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-green-500",
];

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const t = useTranslations("Admin.analytics");

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="size-5" />
          {t("conversionFunnel")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.every((d) => d.value === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("noData")}</p>
        ) : (
          <div className="space-y-4">
            {data.map((step, i) => (
              <div key={step.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t(step.label as "listingsCreated" | "rentalRequests" | "approved" | "completed")}</span>
                  <span className="text-muted-foreground">
                    {step.value}
                    {i > 0 && (
                      <span className="ml-2 text-xs">
                        ({step.percentOfPrevious}% {t("ofPrevious")})
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-8 w-full rounded-md bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-md transition-all flex items-center px-3", BAR_COLORS[i])}
                    style={{ width: `${Math.max((step.value / maxValue) * 100, 2)}%` }}
                  >
                    <span className="text-xs font-medium text-white">
                      {step.percentOfFirst}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
