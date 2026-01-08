import { Calendar } from "lucide-react";
import { ComingSoon } from "@/components/landing/coming-soon";

export default function MyRentalsPage() {
  return (
    <ComingSoon
      icon={Calendar}
      title="My Rentals"
      description="Track your rental requests, active rentals, and rental history all in one place."
    />
  );
}
