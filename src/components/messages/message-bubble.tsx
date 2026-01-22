import Image from "next/image";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    createdAt: Date | string;
    sender: {
      id: string;
      name: string;
      image: string | null;
    };
  };
  isOwnMessage: boolean;
}

function formatMessageTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  if (isToday) {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex items-end gap-2 max-w-[80%]",
        isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      <div className="relative size-7 shrink-0 overflow-hidden rounded-full bg-gray-200">
        {message.sender.image ? (
          <Image
            src={message.sender.image}
            alt={message.sender.name}
            fill
            className="object-cover"
            sizes="28px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-500">
            {message.sender.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {message.content}
        </div>
        <p
          className={cn(
            "mt-1 text-[10px] text-muted-foreground",
            isOwnMessage ? "text-right" : "text-left"
          )}
        >
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
