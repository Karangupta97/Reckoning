"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Layers, Maximize2 } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const HAZARD_POINTS = [
  { coords: [73.0169, 19.0330] as [number, number], type: "pothole" },
  { coords: [72.9781, 19.0760] as [number, number], type: "flooding" },
  { coords: [73.0515, 19.1197] as [number, number], type: "debris" },
  { coords: [72.8411, 19.2183] as [number, number], type: "signal" },
  { coords: [73.1175, 18.9894] as [number, number], type: "pothole" },
];

const TYPE_COLORS: Record<string, string> = {
  pothole: "#EF4444",
  flooding: "#3B82F6",
  debris: "#F59E0B",
  signal: "#22C55E",
};

export function SafetyMapPreview() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const t = useTranslations("dashboard.safetyMap");

  const initMap = useCallback(async () => {
    if (!mapContainer.current || !MAPBOX_TOKEN || mapRef.current) return;

    const mapboxgl = (await import("mapbox-gl")).default;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [73.0, 19.08],
      zoom: 10.5,
      interactive: true,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-left");

    map.on("load", () => {
      // Heatmap source
      map.addSource("hazards-heat", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: HAZARD_POINTS.map((p) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: p.coords },
            properties: { type: p.type },
          })),
        },
      });

      // Heatmap layer
      map.addLayer({
        id: "hazards-heatmap",
        type: "heatmap",
        source: "hazards-heat",
        paint: {
          "heatmap-weight": 1,
          "heatmap-intensity": 0.8,
          "heatmap-radius": 30,
          "heatmap-opacity": 0.6,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            0.2, "rgba(59,130,246,0.4)",
            0.5, "rgba(245,158,11,0.6)",
            0.8, "rgba(239,68,68,0.8)",
            1, "rgba(239,68,68,1)",
          ],
        },
      });

      // Point markers
      HAZARD_POINTS.forEach((point) => {
        const el = document.createElement("div");
        el.style.width = "12px";
        el.style.height = "12px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = TYPE_COLORS[point.type];
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

        new mapboxgl.Marker({ element: el })
          .setLngLat(point.coords)
          .addTo(map);
      });

      setLoaded(true);
    });

    mapRef.current = map;
  }, []);

  useEffect(() => {
    initMap();
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [initMap]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="neu-card overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between p-4 pb-0">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {t("title")}
        </h3>
        <button className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
          <Layers size={14} />
        </button>
      </div>

      <div className="relative flex-1 min-h-[240px] m-4 rounded-xl overflow-hidden">
        <div ref={mapContainer} className="absolute inset-0 reckoning-mini-map" />

        {!loaded && (
          <div className="absolute inset-0 bg-[var(--color-surface)] animate-pulse rounded-xl" />
        )}

        {/* Open full map button */}
        <button className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-primary)] shadow-sm hover:shadow-md transition-shadow">
          <Maximize2 size={13} />
          {t("openFullMap")}
        </button>
      </div>
    </motion.div>
  );
}
