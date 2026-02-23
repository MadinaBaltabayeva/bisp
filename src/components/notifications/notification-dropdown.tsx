"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { markAllNotificationsRead } from "@/features/notifications/actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./notification-item";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  read: boolean;
  createdAt: Date;
  actor: { name: string; image: string | null } | null;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onRefresh: () => void;
}

export function NotificationDropdown({
  notifications,
  onClose,
  onRefresh,
}: NotificationDropdownProps) {
  const t = useTranslations("Notifications");
  const [isPending, startTransition] = useTransition();

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      onRefresh();
    });
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        {notifications.some((n) => !n.read) && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            {t("markAllRead")}
          </button>
        )}
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
          <Bell className="size-8" />
          <p className="text-sm">{t("empty")}</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={onClose}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Footer */}
      <div className="border-t px-4 py-2">
        <Link
          href="/notifications"
          onClick={onClose}
          className="block text-center text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          {t("viewAll")}
        </Link>
      </div>
    </div>
  );
}
