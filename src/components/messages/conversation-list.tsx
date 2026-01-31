"use client";

import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface ConversationItem {
  id: string;
  listing: {
    id: string;
    title: string;
    image: string | null;
  };
  otherUser: {
    id: string;
    name: string;
    image: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: Date | string;
    senderId: string;
  } | null;
  unreadCount: number;
  updatedAt: Date | string;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  activeConversationId?: string;
  onSelect: (id: string) => void;
  currentUserId: string;
}

function timeAgo(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
  currentUserId,
}: ConversationListProps) {
  const router = useRouter();

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <MessageCircle className="size-12 text-muted-foreground/40 mb-3" />
        <h3 className="font-medium text-muted-foreground">
          No conversations yet
        </h3>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Start a conversation by messaging a listing owner.
        </p>
      </div>
    );
  }

  function handleClick(conversationId: string) {
    onSelect(conversationId);
    // On mobile, navigate to full-page chat
    if (window.innerWidth < 768) {
      router.push(`/messages/${conversationId}`);
    }
  }

  return (
    <div className="divide-y overflow-y-auto">
      {conversations.map((conv) => {
        const isActive = conv.id === activeConversationId;
        const preview = conv.lastMessage
          ? conv.lastMessage.content.length > 60
            ? conv.lastMessage.content.slice(0, 60) + "..."
            : conv.lastMessage.content
          : "No messages yet";
        const isOwnMessage = conv.lastMessage?.senderId === currentUserId;

        return (
          <button
            key={conv.id}
            onClick={() => handleClick(conv.id)}
            className={cn(
              "flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted/50",
              isActive && "bg-muted"
            )}
          >
            {/* Avatar */}
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-gray-200">
              {conv.otherUser.image ? (
                <Image
                  src={conv.otherUser.image}
                  alt={conv.otherUser.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-500">
                  {conv.otherUser.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "truncate text-sm",
                    conv.unreadCount > 0 ? "font-semibold" : "font-medium"
                  )}
                >
                  {conv.otherUser.name}
                </p>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {conv.lastMessage
                    ? timeAgo(conv.lastMessage.createdAt)
                    : timeAgo(conv.updatedAt)}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {conv.listing.title}
              </p>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p
                  className={cn(
                    "truncate text-xs",
                    conv.unreadCount > 0
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {isOwnMessage ? `You: ${preview}` : preview}
                </p>
                {conv.unreadCount > 0 && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
