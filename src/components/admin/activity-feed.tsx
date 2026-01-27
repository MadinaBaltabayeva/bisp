import {
  UserPlus,
  Package,
  Calendar,
  Star,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
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
                      {formatDistanceToNow(new Date(item.timestamp), {
                        addSuffix: true,
                      })}
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
