"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface ReportLocationMapProps {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
}

function MapUpdater({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), { animate: true });
  }, [latitude, longitude, map]);

  return null;
}

export function ReportLocationMap({ latitude, longitude, onChange }: ReportLocationMapProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={16}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapUpdater latitude={latitude} longitude={longitude} />
      <Marker
        position={[latitude, longitude]}
        draggable
        icon={markerIcon}
        eventHandlers={{
          dragend: (event) => {
            const marker = event.target as L.Marker;
            const nextPosition = marker.getLatLng();
            onChange(nextPosition.lat, nextPosition.lng);
          },
        }}
      />
    </MapContainer>
  );
}
