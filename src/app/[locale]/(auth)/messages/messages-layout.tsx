"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConversationList } from "@/components/messages/conversation-list";
import { ChatView } from "@/components/messages/chat-view";

interface Conversation {
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

interface MessagesLayoutProps {
  conversations: Conversation[];
  currentUserId: string;
  currentUser: { id: string; name: string; image: string | null };
}

export function MessagesLayout({
  conversations,
  currentUserId,
  currentUser,
}: MessagesLayoutProps) {
  const t = useTranslations("Messages");
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  return (
    <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-lg border">
      {/* Left panel: Conversation list */}
      <div
        className={`w-full border-r md:w-80 md:block ${
          activeConversationId ? "hidden" : "block"
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId ?? undefined}
          onSelect={setActiveConversationId}
          currentUserId={currentUserId}
        />
      </div>

      {/* Right panel: Chat view (desktop only via split, or full on mobile) */}
      <div className="hidden flex-1 md:flex">
        {activeConversation ? (
          <div className="flex-1">
            <ChatView
              key={activeConversation.id}
              conversationId={activeConversation.id}
              currentUser={currentUser}
              otherUser={activeConversation.otherUser}
              listing={activeConversation.listing}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <MessageCircle className="size-14 text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {t("selectConversation")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground/70">
              {t("selectConversationHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
