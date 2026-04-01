"use client";

import { useEffect, useRef } from "react";
import { trackSearchImpressions } from "@/features/analytics/track";

export function TrackSearchImpressions({ listingIds }: { listingIds: string[] }) {
  const tracked = useRef(false);
  const key = listingIds.join(",");

  useEffect(() => {
    if (tracked.current || listingIds.length === 0) return;
    tracked.current = true;
    trackSearchImpressions(listingIds);
  }, [key]);

  return null;
}
