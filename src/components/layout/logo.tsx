"use client";

import { Link } from "@/i18n/navigation";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1.5 hover:opacity-90 transition-opacity">
      <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-white text-xs font-bold">R</span>
      <span className="text-lg font-extrabold tracking-tight text-stone-800">ent<span className="text-amber-600">Hub</span></span>
    </Link>
  );
}
