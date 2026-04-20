"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import {
  LogOut,
  User,
  Settings,
  Shield,
  BarChart3,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { useBadgeCounts, NavBadgeIndicator } from "./nav-badge";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { href: "/browse", labelKey: "browse", public: false },
  { href: "/favorites", labelKey: "favorites", public: false },
  { href: "/dashboard", labelKey: "dashboard", public: false },
  { href: "/listings/new", labelKey: "listItem", public: false },
  { href: "/rentals", labelKey: "myRentals", badgeKey: "rentals" as const, public: false },
  { href: "/messages", labelKey: "messages", badgeKey: "messages" as const, public: false },
] as const;

interface TopNavbarProps {
  onOpenAuthModal: (view: "login" | "signup") => void;
}

export function TopNavbar({ onOpenAuthModal }: TopNavbarProps) {
  const t = useTranslations("Navigation");
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const badgeCounts = useBadgeCounts();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden md:flex items-center gap-7 text-[13.5px] text-stone-600">
          {NAV_LINKS.filter((link) => link.public || (mounted && session)).map((link) => {
            const badgeCount =
              "badgeKey" in link && link.badgeKey === "rentals"
                ? badgeCounts.rentals
                : "badgeKey" in link && link.badgeKey === "messages"
                  ? badgeCounts.messages
                  : 0;
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative inline-block py-1 transition-colors",
                  active
                    ? "font-medium text-stone-900"
                    : "text-stone-600 hover:text-stone-900"
                )}
              >
                {t(link.labelKey)}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-[18px] h-[2px] bg-stone-900"
                  />
                )}
                {badgeCount > 0 && (
                  <span className="absolute -right-2 -top-1">
                    <NavBadgeIndicator count={badgeCount} />
                  </span>
                )}
              </Link>
            );
          })}
          {mounted && session?.user?.role === "admin" && (
            <Link
              href="/admin/dashboard"
              className={cn(
                "relative inline-flex items-center gap-1 py-1 transition-colors",
                isActive("/admin")
                  ? "font-medium text-stone-900"
                  : "text-stone-600 hover:text-stone-900"
              )}
            >
              <Shield className="size-3.5" />
              {t("admin")}
              {isActive("/admin") && (
                <span aria-hidden className="absolute inset-x-0 -bottom-[18px] h-[2px] bg-stone-900" />
              )}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {!mounted ? (
            <div className="h-8 w-8 rounded-full bg-stone-100" />
          ) : session ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2">
                    <Avatar className="size-8">
                      <AvatarImage
                        src={session.user.image || undefined}
                        alt={session.user.name}
                      />
                      <AvatarFallback className="bg-stone-200 text-stone-700">
                        {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href={`/profiles/${session.user.id}`}>
                        <User className="size-4" />
                        {t("myProfile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <BarChart3 className="size-4" />
                        {t("dashboard")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="size-4" />
                        {t("settings")}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                    <LogOut className="size-4" />
                    {t("logOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenAuthModal("login")}
                className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors"
              >
                {t("logIn")}
              </button>
              <button
                type="button"
                onClick={() => onOpenAuthModal("signup")}
                className="hidden sm:inline-flex rounded-full bg-stone-900 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-stone-800 transition-colors"
              >
                {t("signUp")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
