"use client";

import { Link } from "@/i18n/navigation";

export function Logo() {
  return (
    <Link href="/" className="font-serif text-[22px] font-medium tracking-tight text-stone-900 hover:opacity-80 transition-opacity">
      RentHub
    </Link>
  );
}
