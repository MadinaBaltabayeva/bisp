"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { MessageCircle } from "lucide-react";

import { MessageBubble } from "@/components/messages/message-bubble";
import { MessageInput } from "@/components/messages/message-input";

interface MessageData {
  id: string;
  content: string;
  createdAt: Date | string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface ChatViewProps {
  conversationId: string;
  currentUser: { id: string; name: string; image: string | null };
  otherUser: { id: string; name: string; image: string | null };
  listing: { id: string; title: string };
  initialMessages?: MessageData[];
}

export function ChatView({
  conversationId,
  currentUser,
  otherUser,
  listing,
  initialMessages = [],
}: ChatViewProps) {
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/messages/${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages) {
            setMessages(data.messages);
          }
        }
      } catch {
        // Silently handle polling errors
      }
    };

    // Initial fetch
    poll();

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  function handleMessageSent(message: MessageData) {
    setMessages((prev) => [...prev, message]);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-gray-200">
          {otherUser.image ? (
            <Image
              src={otherUser.image}
              alt={otherUser.name}
              fill
              className="object-cover"
              sizes="36px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-500">
              {otherUser.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{otherUser.name}</p>
          <Link
            href={`/listings/${listing.id}`}
            className="text-xs text-muted-foreground hover:text-primary truncate block"
          >
            {listing.title}
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageCircle className="size-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwnMessage={msg.senderId === currentUser.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversationId}
        onMessageSent={handleMessageSent}
        currentUser={currentUser}
      />
    </div>
  );
}
