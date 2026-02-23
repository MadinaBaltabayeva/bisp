"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { formatDistanceToNow } from "date-fns";
import { markNotificationRead } from "@/features/notifications/actions";
import { NotificationIcon } from "./notification-icon";

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    linkUrl: string | null;
    read: boolean;
    createdAt: Date;
    actor: { name: string; image: string | null } | null;
  };
  onRead?: () => void;
}

export function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      if (!notification.read) {
        await markNotificationRead(notification.id);
      }
      onRead?.();
      if (notification.linkUrl) {
        router.push(notification.linkUrl);
      }
    });
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-60"
    >
      {/* Unread dot + icon */}
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <span
          className={`size-2 rounded-full ${notification.read ? "bg-transparent" : "bg-primary-500"}`}
        />
        <NotificationIcon type={notification.type} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-snug ${notification.read ? "font-normal text-gray-700" : "font-semibold text-gray-900"}`}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-gray-400">{timeAgo}</p>
      </div>
    </button>
  );
}
