"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSON } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";

import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * BIMSTEC / India sample risk points. `weight` drives heatmap intensity.
 * Coordinates are [lng, lat]. These are illustrative predictive risk zones, not
 * real incident data.
 */
type RiskKind = "accident" | "highRisk" | "weather" | "infrastructure";

const RISK_POINTS: Array<{ coords: [number, number]; kind: RiskKind; weight: number }> = [
  // Accident hotspots (red) — dense urban corridors
  { coords: [77.209, 28.6139], kind: "accident", weight: 1 }, // Delhi
  { coords: [72.8777, 19.076], kind: "accident", weight: 0.9 }, // Mumbai
  { coords: [88.3639, 22.5726], kind: "accident", weight: 0.8 }, // Kolkata
  // High risk areas (orange)
  { coords: [80.2707, 13.0827], kind: "highRisk", weight: 0.7 }, // Chennai
  { coords: [78.4867, 17.385], kind: "highRisk", weight: 0.65 }, // Hyderabad
  { coords: [85.324, 27.7172], kind: "highRisk", weight: 0.6 }, // Kathmandu, Nepal
  // Weather impact (blue) — coastal / monsoon-prone
  { coords: [90.4125, 23.8103], kind: "weather", weight: 0.7 }, // Dhaka, Bangladesh
  { coords: [79.8612, 6.9271], kind: "weather", weight: 0.6 }, // Colombo, Sri Lanka
  { coords: [96.1951, 16.8409], kind: "weather", weight: 0.55 }, // Yangon, Myanmar
  // Infrastructure trends (green)
  { coords: [100.5018, 13.7563], kind: "infrastructure", weight: 0.5 }, // Bangkok, Thailand
  { coords: [89.6177, 27.4712], kind: "infrastructure", weight: 0.45 }, // Thimphu, Bhutan
  { coords: [75.7873, 26.9124], kind: "infrastructure", weight: 0.5 }, // Jaipur
];

const KIND_COLORS: Record<RiskKind, string> = {
  accident: "#EF4444",
  highRisk: "#F59E0B",
  weather: "#3B82F6",
  infrastructure: "#22C55E",
};

function toFeatureCollection(kind: RiskKind): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: RISK_POINTS.filter((p) => p.kind === kind).map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: p.coords },
      properties: { weight: p.weight },
    })),
  };
}

/** Static gradient heatmap fallback (no token / load failure). */
function FallbackHeatmap() {
  return (
    <div className="absolute inset-0">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 28% 38%, rgba(239,68,68,0.85) 0%, rgba(239,68,68,0) 22%), radial-gradient(circle at 33% 46%, rgba(245,158,11,0.7) 0%, rgba(245,158,11,0) 26%), radial-gradient(circle at 68% 60%, rgba(245,158,11,0.65) 0%, rgba(245,158,11,0) 24%), radial-gradient(circle at 72% 66%, rgba(239,68,68,0.6) 0%, rgba(239,68,68,0) 18%), radial-gradient(circle at 55% 30%, rgba(59,130,246,0.5) 0%, rgba(59,130,246,0) 22%), radial-gradient(circle at 82% 40%, rgba(34,197,94,0.45) 0%, rgba(34,197,94,0) 20%)",
        }}
      />
      <span className="absolute left-[29%] top-[40%] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-danger)] ring-4 ring-[color-mix(in_srgb,var(--color-danger)_25%,transparent)]" />
      <span className="absolute left-[70%] top-[63%] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-amber)] ring-4 ring-[color-mix(in_srgb,var(--color-amber)_25%,transparent)]" />
    </div>
  );
}

/**
 * Non-interactive Mapbox mini map showing predictive risk heatmaps across
 * India / BIMSTEC. Lazy-initialized when scrolled into view; all interaction
 * handlers, controls and attribution are disabled so it reads as a live
 * intelligence dashboard rather than a navigation map.
 *
 * Falls back to a static gradient heatmap when no Mapbox token is configured.
 */
export function PredictiveMap() {
  const { ref: visRef, isVisible } = useIntersectionObserver<HTMLDivElement>({
    rootMargin: "200px",
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setFailed(true);
      return;
    }
    if (!isVisible || !containerRef.current) return;

    let map: import("mapbox-gl").Map | undefined;
    let cancelled = false;

    (async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;

        if (cancelled || !containerRef.current) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;

        map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [85, 21],
          zoom: 3.1,
          interactive: false, // disables all user interaction
          attributionControl: false,
          logoPosition: "bottom-left",
          fadeDuration: 0,
          preserveDrawingBuffer: false,
        });

        map.on("load", () => {
          if (cancelled || !map) return;

          (Object.keys(KIND_COLORS) as RiskKind[]).forEach((kind) => {
            const color = KIND_COLORS[kind];
            const sourceId = `risk-${kind}`;

            map!.addSource(sourceId, {
              type: "geojson",
              data: toFeatureCollection(kind),
            });

            map!.addLayer({
              id: `${sourceId}-heat`,
              type: "heatmap",
              source: sourceId,
              paint: {
                "heatmap-weight": ["get", "weight"],
                "heatmap-intensity": 1.1,
                "heatmap-radius": 38,
                "heatmap-opacity": 0.75,
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0,
                  "rgba(0,0,0,0)",
                  0.2,
                  `${color}33`,
                  0.5,
                  `${color}99`,
                  1,
                  color,
                ],
              },
            });

            // Small core marker per point for a "dashboard" feel.
            map!.addLayer({
              id: `${sourceId}-point`,
              type: "circle",
              source: sourceId,
              paint: {
                "circle-radius": 3,
                "circle-color": color,
                "circle-blur": 0.4,
                "circle-opacity": 0.9,
              },
            });
          });

          if (!cancelled) setReady(true);
        });

        map.on("error", () => {
          if (!cancelled) setFailed(true);
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [isVisible]);

  return (
    <div
      ref={visRef}
      className="reckoning-mini-map relative h-[220px] w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] shadow-[var(--shadow-neu)]"
    >
      {failed ? (
        <FallbackHeatmap />
      ) : (
        <>
          {/* Map canvas */}
          <div
            ref={containerRef}
            className={`absolute inset-0 transition-opacity duration-500 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden="true"
          />
          {/* Loading shimmer until the map paints */}
          {!ready && (
            <div className="absolute inset-0 animate-pulse bg-[var(--color-surface)]" />
          )}
          {/* Subtle vignette to blend the map into the card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-[var(--color-border)]"
          />
        </>
      )}
    </div>
  );
}
