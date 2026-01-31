"use client";

import { Link, usePathname } from "@/i18n/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  ShieldAlert,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/moderation", label: "Moderation", icon: ShieldAlert },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 flex-col border-r bg-white min-h-screen">
      {/* Back to RentHub */}
      <div className="p-4 border-b">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to RentHub
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom label */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="size-4" />
          Admin Panel
        </div>
      </div>
    </aside>
  );
}
