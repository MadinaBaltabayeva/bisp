"use client";

import { Calendar, MessageCircle, Star, Heart, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  rental: { icon: Calendar, color: "text-blue-500" },
  message: { icon: MessageCircle, color: "text-green-500" },
  review: { icon: Star, color: "text-amber-500" },
  favorite: { icon: Heart, color: "text-red-500" },
};

interface NotificationIconProps {
  type: string;
  className?: string;
}

export function NotificationIcon({ type, className }: NotificationIconProps) {
  const config = TYPE_CONFIG[type] ?? { icon: Bell, color: "text-gray-500" };
  const Icon = config.icon;

  return <Icon className={cn("size-4", config.color, className)} />;
}
