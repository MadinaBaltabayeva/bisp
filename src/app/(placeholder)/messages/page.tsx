import { MessageCircle } from "lucide-react";
import { ComingSoon } from "@/components/landing/coming-soon";

export default function MessagesPage() {
  return (
    <ComingSoon
      icon={MessageCircle}
      title="Messages"
      description="Chat with other users about rentals, coordinate pickups, and ask questions."
    />
  );
}
