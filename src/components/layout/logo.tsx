"use client";

import { Package } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
      <Package className="size-7 text-primary-600" />
      <span className="text-xl font-bold text-primary-600">RentHub</span>
    </Link>
  );
}
