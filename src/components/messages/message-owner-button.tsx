"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getOrCreateConversation } from "@/features/messages/actions";
import { Button } from "@/components/ui/button";

interface MessageOwnerButtonProps {
  listingId: string;
}

export function MessageOwnerButton({ listingId }: MessageOwnerButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await getOrCreateConversation(listingId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.conversationId) {
        router.push(`/messages/${result.conversationId}`);
      }
    });
  }

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <MessageCircle className="mr-2 size-4" />
      )}
      Message Owner
    </Button>
  );
}
