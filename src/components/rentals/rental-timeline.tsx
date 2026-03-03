"use client";

import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const STATUS_ORDER = [
  "requested",
  "approved",
  "active",
  "returned",
  "completed",
];

interface TimelineEvent {
  status: string;
  createdAt: Date;
  actorId: string;
}

interface RentalTimelineProps {
  events: TimelineEvent[];
  currentStatus: string;
}

export function RentalTimeline({
  events,
  currentStatus,
}: RentalTimelineProps) {
  const t = useTranslations("Timeline");
  const format = useFormatter();

  // Map events by status for lookup
  const eventMap = new Map(events.map((e) => [e.status, e]));

  // If declined, show alternate two-step timeline
  const isDeclined = currentStatus === "declined";
  const steps = isDeclined ? ["requested", "declined"] : STATUS_ORDER;

  // Check for extra statuses (disputed, cancelled) that branch off the normal flow
  const disputedEvent = eventMap.get("disputed");
  const cancelledEvent = eventMap.get("cancelled");

  return (
    <div className="relative pl-8">
      {/* Vertical connecting line */}
      <div className="absolute left-[11px] top-1 bottom-6 w-0.5 bg-gray-200" />

      <div className="space-y-6">
        {steps.map((status) => {
          const event = eventMap.get(status);
          const isReached = !!event;

          return (
            <div key={status} className="relative flex items-start gap-4">
              {/* Dot */}
              <div
                className={cn(
                  "absolute -left-5 top-0.5 size-3 rounded-full border-2",
                  isReached
                    ? "border-primary bg-primary"
                    : "border-gray-300 bg-white"
                )}
              />

              {/* Content */}
              <div className="flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isReached ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {t(status as Parameters<typeof t>[0])}
                </p>
                {event ? (
                  <p className="text-xs text-muted-foreground">
                    {format.dateTime(new Date(event.createdAt), {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/50">&mdash;</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Disputed event (branching red dot) */}
        {disputedEvent && (
          <div className="relative flex items-start gap-4">
            <div className="absolute -left-5 top-0.5 size-3 rounded-full border-2 border-red-500 bg-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">
                {t("disputed" as Parameters<typeof t>[0])}
              </p>
              <p className="text-xs text-muted-foreground">
                {format.dateTime(new Date(disputedEvent.createdAt), {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        )}

        {/* Cancelled event (gray dot) */}
        {cancelledEvent && (
          <div className="relative flex items-start gap-4">
            <div className="absolute -left-5 top-0.5 size-3 rounded-full border-2 border-gray-400 bg-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">
                {t("cancelled" as Parameters<typeof t>[0])}
              </p>
              <p className="text-xs text-muted-foreground">
                {format.dateTime(new Date(cancelledEvent.createdAt), {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
