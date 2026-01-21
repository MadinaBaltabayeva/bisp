import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  requested: {
    label: "Requested",
    className: "",
    variant: "secondary",
  },
  approved: {
    label: "Approved",
    className: "border-blue-300 bg-blue-50 text-blue-700",
    variant: "outline",
  },
  active: {
    label: "Active",
    className: "bg-green-600 text-white hover:bg-green-700",
    variant: "default",
  },
  returned: {
    label: "Returned",
    className: "border-amber-300 bg-amber-50 text-amber-700",
    variant: "outline",
  },
  completed: {
    label: "Completed",
    className: "bg-gray-100 text-gray-600",
    variant: "secondary",
  },
  declined: {
    label: "Declined",
    className: "",
    variant: "destructive",
  },
};

export function RentalStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "",
    variant: "secondary" as const,
  };

  return (
    <Badge variant={config.variant} className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
