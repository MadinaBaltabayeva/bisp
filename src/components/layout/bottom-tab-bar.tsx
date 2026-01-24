"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, PlusCircle, Calendar, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBadgeCounts, NavBadgeIndicator } from "./nav-badge";

const TAB_ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/#categories", label: "Browse", icon: Search },
  { href: "/listings/new", label: "List", icon: PlusCircle },
  { href: "/rentals", label: "Rentals", icon: Calendar },
  { href: "/messages", label: "Messages", icon: MessageCircle },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const badgeCounts = useBadgeCounts();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white md:hidden">
      <div className="flex h-16 items-center justify-around">
        {TAB_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          const badgeCount =
            item.href === "/rentals"
              ? badgeCounts.rentals
              : item.href === "/messages"
                ? badgeCounts.messages
                : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <span className="relative">
                <item.icon
                  className={cn(
                    "size-5",
                    isActive ? "text-primary-600" : "text-gray-400"
                  )}
                />
                <NavBadgeIndicator count={badgeCount} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
