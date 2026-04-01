"use client";

import {
  UserPlus,
  Package,
  Calendar,
  Star,
  Activity,
} from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TYPE_ICONS: Record<string, typeof Activity> = {
  user_joined: UserPlus,
  listing_created: Package,
  rental_requested: Calendar,
  review_left: Star,
};

interface ActivityFeedProps {
  items: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  const t = useTranslations("Admin.dashboard");
  const format = useFormatter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recentActivity")}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noActivity")}</p>
        ) : (
          <div className="space-y-4">
            {items.map((item, i) => {
              const Icon = TYPE_ICONS[item.type] || Activity;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <Icon className="size-4 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format.relativeTime(new Date(item.timestamp), new Date())}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
