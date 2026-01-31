"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import {
  Search,
  PlusCircle,
  Calendar,
  MessageCircle,
  LogOut,
  User,
  Settings,
  Shield,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { useBadgeCounts, NavBadgeIndicator } from "./nav-badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  { href: "/", label: "Browse", icon: Search },
  { href: "/listings/new", label: "List an Item", icon: PlusCircle },
  { href: "/rentals", label: "My Rentals", icon: Calendar },
  { href: "/messages", label: "Messages", icon: MessageCircle },
];

interface TopNavbarProps {
  onOpenAuthModal: (view: "login" | "signup") => void;
}

export function TopNavbar({ onOpenAuthModal }: TopNavbarProps) {
  const { data: session } = authClient.useSession();
  const router = useRouter();
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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Logo />

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const badgeCount =
              link.href === "/rentals"
                ? badgeCounts.rentals
                : link.href === "/messages"
                  ? badgeCounts.messages
                  : 0;

            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
              >
                <span className="relative">
                  <link.icon className="size-4" />
                  <NavBadgeIndicator count={badgeCount} />
                </span>
                {link.label}
              </Link>
            );
          })}
          {mounted && session?.user?.role === "admin" && (
            <Link
              href="/admin/dashboard"
              className="relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
            >
              <Shield className="size-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right side: language + auth state */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {!mounted ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
                  <Avatar>
                    <AvatarImage
                      src={session.user.image || undefined}
                      alt={session.user.name}
                    />
                    <AvatarFallback className="bg-primary-100 text-primary-700">
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
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="size-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                  <LogOut className="size-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAuthModal("login")}
              >
                Log In
              </Button>
              <Button
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => onOpenAuthModal("signup")}
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
