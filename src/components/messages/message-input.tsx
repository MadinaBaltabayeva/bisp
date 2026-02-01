"use client";

import { useRef, useState, useTransition } from "react";
import { Send, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { sendMessage } from "@/features/messages/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
  conversationId: string;
  onMessageSent: (message: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    sender: { id: string; name: string; image: string | null };
  }) => void;
  currentUser: { id: string; name: string; image: string | null };
}

export function MessageInput({
  conversationId,
  onMessageSent,
  currentUser,
}: MessageInputProps) {
  const t = useTranslations("Messages");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || isPending) return;

    // Optimistic message
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      createdAt: new Date().toISOString(),
      senderId: currentUser.id,
      sender: currentUser,
    };

    onMessageSent(optimisticMessage);
    setContent("");

    // Auto-resize textarea back
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    startTransition(async () => {
      const result = await sendMessage({
        conversationId,
        content: trimmed,
      });

      if (result.error) {
        // On error, the poll will correct state
        console.error("Failed to send message:", result.error);
      }
    });
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);

    // Auto-grow textarea (max 3 lines ~= 72px)
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 72)}px`;
  }

  return (
    <div className="flex items-end gap-2 border-t bg-background p-3">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={t("typePlaceholder")}
        maxLength={2000}
        rows={1}
        className="min-h-[40px] max-h-[72px] resize-none"
        disabled={isPending}
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={isPending || !content.trim()}
        className="shrink-0"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </Button>
    </div>
  );
}
