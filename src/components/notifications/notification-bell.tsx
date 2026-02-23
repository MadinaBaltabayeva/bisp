"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { NavBadgeIndicator } from "@/components/layout/nav-badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationDropdown } from "./notification-dropdown";

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  read: boolean;
  createdAt: Date;
  actor: { name: string; image: string | null } | null;
}

export function NotificationBell() {
  const t = useTranslations("Notifications");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [open, setOpen] = useState(false);

  // Poll unread count every 30 seconds
  useEffect(() => {
    let active = true;

    async function fetchUnread() {
      try {
        const res = await fetch("/api/notifications/unread");
        if (res.ok && active) {
          const data = await res.json();
          setUnreadCount(data.count);
        }
      } catch {
        // Silently fail -- badge count is non-critical
      }
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch recent notifications when popover opens
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/recent");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      fetchNotifications();
    }
  };

  const handleRefresh = () => {
    fetchNotifications();
    // Re-fetch unread count too
    fetch("/api/notifications/unread")
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count))
      .catch(() => {});
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          aria-label={t("bell")}
        >
          <Bell className="size-5" />
          <NavBadgeIndicator count={unreadCount} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <NotificationDropdown
          notifications={notifications}
          onClose={() => setOpen(false)}
          onRefresh={handleRefresh}
        />
      </PopoverContent>
    </Popover>
  );
}
