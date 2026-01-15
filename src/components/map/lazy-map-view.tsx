"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MapView = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
});

interface LazyMapViewProps {
  listings: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    price: string;
  }>;
  center?: [number, number];
  zoom?: number;
  radius?: number;
  userLocation?: [number, number];
}

export function LazyMapView(props: LazyMapViewProps) {
  return <MapView {...props} />;
}
