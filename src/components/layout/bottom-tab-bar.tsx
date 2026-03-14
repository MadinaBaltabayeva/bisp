"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { House, Search, Heart, PlusCircle, Calendar, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBadgeCounts, NavBadgeIndicator } from "./nav-badge";

const TAB_ITEMS = [
  { href: "/", labelKey: "home", icon: House },
  { href: "/#categories", labelKey: "browse", icon: Search },
  { href: "/favorites", labelKey: "favorites", icon: Heart },
  { href: "/listings/new", labelKey: "list", icon: PlusCircle },
  { href: "/rentals", labelKey: "rentals", icon: Calendar },
  { href: "/messages", labelKey: "messages", icon: MessageCircle },
] as const;

export function BottomTabBar() {
  const t = useTranslations("BottomNav");
  const pathname = usePathname();
  const badgeCounts = useBadgeCounts();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-stone-100 md:hidden">
      <div className="mx-auto flex h-16 items-center justify-around px-2">
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
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-all",
                isActive
                  ? "text-amber-700 bg-amber-50"
                  : "text-stone-400 hover:text-stone-600"
              )}
            >
              <span className="relative">
                <item.icon
                  className={cn(
                    "size-5",
                    isActive ? "text-amber-600" : "text-stone-400"
                  )}
                />
                <NavBadgeIndicator count={badgeCount} />
              </span>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
