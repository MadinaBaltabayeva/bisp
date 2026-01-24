"use client";

import { useEffect, useState } from "react";

interface BadgeCounts {
  rentals: number;
  messages: number;
}

/**
 * Hook to fetch badge counts for nav items.
 * Polls every 30 seconds when the tab is visible.
 */
export function useBadgeCounts() {
  const [counts, setCounts] = useState<BadgeCounts>({ rentals: 0, messages: 0 });

  useEffect(() => {
    let active = true;

    async function fetchCounts() {
      try {
        const res = await fetch("/api/badges");
        if (res.ok && active) {
          const data = await res.json();
          setCounts(data);
        }
      } catch {
        // Silently fail -- badge counts are non-critical
      }
    }

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return counts;
}

/**
 * Small badge dot/count indicator for nav items.
 */
export function NavBadgeIndicator({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}
