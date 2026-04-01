"use client";

import { useEffect, useRef } from "react";
import { trackListingView, trackProfileView } from "@/features/analytics/track";

export function TrackListingView({ listingId }: { listingId: string }) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackListingView(listingId);
  }, [listingId]);
  return null;
}

export function TrackProfileView({ userId }: { userId: string }) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackProfileView(userId);
  }, [userId]);
  return null;
}
