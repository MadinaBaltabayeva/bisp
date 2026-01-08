import { PlusCircle } from "lucide-react";
import { ComingSoon } from "@/components/landing/coming-soon";

export default function ListAnItemPage() {
  return (
    <ComingSoon
      icon={PlusCircle}
      title="List an Item"
      description="Soon you'll be able to list your items for rent and earn money from things you already own."
    />
  );
}
