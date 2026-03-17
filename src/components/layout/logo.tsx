"use client";

import { Link } from "@/i18n/navigation";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary-600 shadow-warm-sm">
        <span className="text-lg font-bold text-white">R</span>
      </div>
      <span className="text-xl font-bold text-stone-800">Rent</span>
      <span className="-ml-1.5 text-xl font-bold text-primary-600">Hub</span>
    </Link>
  );
}
