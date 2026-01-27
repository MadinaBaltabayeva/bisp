import { BadgeCheck } from "lucide-react";

export function VerificationBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-blue-600 ${className ?? ""}`}
    >
      <BadgeCheck className="size-4 fill-blue-600 text-white" />
      <span className="text-xs font-medium">Verified</span>
    </span>
  );
}

export function VerificationBadgeIcon({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={`size-4 fill-blue-600 text-white ${className ?? ""}`}
    />
  );
}
