"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  string,
  { labelKey: string; className: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  requested: {
    labelKey: "requested",
    className: "",
    variant: "secondary",
  },
  approved: {
    labelKey: "approved",
    className: "border-blue-300 bg-blue-50 text-blue-700",
    variant: "outline",
  },
  active: {
    labelKey: "active",
    className: "bg-green-600 text-white hover:bg-green-700",
    variant: "default",
  },
  returned: {
    labelKey: "returned",
    className: "border-amber-300 bg-amber-50 text-amber-700",
    variant: "outline",
  },
  completed: {
    labelKey: "completed",
    className: "bg-gray-100 text-gray-600",
    variant: "secondary",
  },
  declined: {
    labelKey: "declined",
    className: "",
    variant: "destructive",
  },
};

export function RentalStatusBadge({ status }: { status: string }) {
  const t = useTranslations("Rentals.status");

  const config = STATUS_CONFIG[status] ?? {
    labelKey: status,
    className: "",
    variant: "secondary" as const,
  };

  return (
    <Badge variant={config.variant} className={cn(config.className)}>
      {t(config.labelKey as Parameters<typeof t>[0])}
    </Badge>
  );
}
