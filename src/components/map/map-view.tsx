"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

// Fix default marker icon for Leaflet in bundled environments
const defaultIcon = L.icon({
  iconUrl: "/map/marker-icon.png",
  iconRetinaUrl: "/map/marker-icon-2x.png",
  shadowUrl: "/map/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface MapListing {
  id: string;
  lat: number;
  lng: number;
  title: string;
  price: string;
}

interface MapViewProps {
  listings: MapListing[];
  center?: [number, number];
  zoom?: number;
  radius?: number; // in miles
  userLocation?: [number, number];
}

function RadiusCircle({
  center,
  radiusMiles,
}: {
  center: [number, number];
  radiusMiles: number;
}) {
  const map = useMap();

  useEffect(() => {
    // Auto-center and zoom to fit the radius circle
    const radiusMeters = radiusMiles * 1609.34;
    const bounds = L.latLng(center[0], center[1]).toBounds(radiusMeters * 2);
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [map, center, radiusMiles]);

  return (
    <Circle
      center={center}
      radius={radiusMiles * 1609.34}
      pathOptions={{
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        weight: 2,
      }}
    />
  );
}

export default function MapView({
  listings,
  center = [39.8283, -98.5795],
  zoom = 4,
  radius,
  userLocation,
}: MapViewProps) {
  const mapCenter = userLocation ?? center;
  const mapZoom = userLocation && radius ? undefined : zoom;

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom ?? zoom}
      className="h-[400px] w-full rounded-lg"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {listings.map((listing) => (
        <Marker key={listing.id} position={[listing.lat, listing.lng]}>
          <Popup>
            <div className="text-sm">
              <Link
                href={`/listings/${listing.id}`}
                className="font-medium hover:underline"
              >
                {listing.title}
              </Link>
              <p className="text-muted-foreground">{listing.price}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {userLocation && radius && (
        <RadiusCircle center={userLocation} radiusMiles={radius} />
      )}
    </MapContainer>
  );
}
