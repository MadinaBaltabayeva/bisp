"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { House, Search, Heart, PlusCircle, Calendar, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useBadgeCounts, NavBadgeIndicator } from "./nav-badge";

const TAB_ITEMS = [
  { href: "/", labelKey: "home", icon: House, public: true },
  { href: "/#categories", labelKey: "browse", icon: Search, public: true },
  { href: "/favorites", labelKey: "favorites", icon: Heart, public: false },
  { href: "/listings/new", labelKey: "list", icon: PlusCircle, public: false },
  { href: "/rentals", labelKey: "rentals", icon: Calendar, public: false },
  { href: "/messages", labelKey: "messages", icon: MessageCircle, public: false },
] as const;

export function BottomTabBar() {
  const t = useTranslations("BottomNav");
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const [mounted, setMounted] = useState(false);
  const badgeCounts = useBadgeCounts();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200/60 bg-white/90 backdrop-blur-lg md:hidden">
      <div className="pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-14 items-center justify-around px-2">
          {TAB_ITEMS.filter((item) => item.public || (mounted && session)).map((item) => {
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
                  "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-all",
                  isActive ? "bg-primary-50 text-primary-700" : "text-stone-400"
                )}
              >
                <span className="relative">
                  <item.icon
                    className={cn(
                      "size-5",
                      isActive ? "text-primary-600" : "text-stone-400"
                    )}
                  />
                  <NavBadgeIndicator count={badgeCount} />
                </span>
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
