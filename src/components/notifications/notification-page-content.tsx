"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Bell } from "lucide-react";
import { markAllNotificationsRead } from "@/features/notifications/actions";
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

interface NotificationPageContentProps {
  notifications: Notification[];
}

export function NotificationPageContent({
  notifications,
}: NotificationPageContentProps) {
  const t = useTranslations("Notifications");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  };

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        {hasUnread && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            {t("markAllRead")}
          </button>
        )}
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
          <Bell className="size-12" />
          <p className="text-base">{t("empty")}</p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border bg-white">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </div>
  );
}
