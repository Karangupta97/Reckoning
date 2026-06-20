"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

/**
 * The token is read at module scope. Next.js inlines NEXT_PUBLIC_* env vars at
 * COMPILE TIME — meaning the value is baked into the JS bundle. If the .next
 * cache was built before the token was added to .env.local, the bundle will
 * contain `undefined` or `""`. Solution: delete .next and rebuild/restart.
 */
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type RiskKind = "accident" | "highRisk" | "weather" | "infrastructure";

const RISK_POINTS: Array<{
  coords: [number, number];
  kind: RiskKind;
  weight: number;
}> = [
  { coords: [77.209, 28.6139], kind: "accident", weight: 1 },
  { coords: [72.8777, 19.076], kind: "accident", weight: 0.9 },
  { coords: [88.3639, 22.5726], kind: "accident", weight: 0.8 },
  { coords: [80.2707, 13.0827], kind: "highRisk", weight: 0.7 },
  { coords: [78.4867, 17.385], kind: "highRisk", weight: 0.65 },
  { coords: [85.324, 27.7172], kind: "highRisk", weight: 0.6 },
  { coords: [90.4125, 23.8103], kind: "weather", weight: 0.7 },
  { coords: [79.8612, 6.9271], kind: "weather", weight: 0.6 },
  { coords: [96.1951, 16.8409], kind: "weather", weight: 0.55 },
  { coords: [100.5018, 13.7563], kind: "infrastructure", weight: 0.5 },
  { coords: [89.6177, 27.4712], kind: "infrastructure", weight: 0.45 },
  { coords: [75.7873, 26.9124], kind: "infrastructure", weight: 0.5 },
];

const KIND_COLORS: Record<RiskKind, string> = {
  accident: "#EF4444",
  highRisk: "#F59E0B",
  weather: "#3B82F6",
  infrastructure: "#22C55E",
};

function toGeoJSON(kind: RiskKind) {
  return {
    type: "FeatureCollection" as const,
    features: RISK_POINTS.filter((p) => p.kind === kind).map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: p.coords },
      properties: { weight: p.weight },
    })),
  };
}

type Status = "loading" | "ready" | "error";

/**
 * Full interactive Mapbox analytics map.
 *
 * Debugging:
 * - If you see "Token missing" → .next cache has stale bundle without the token.
 *   Delete .next and restart: `rm -rf .next && npm run dev`
 * - If you see "Token invalid" → check .env.local value starts with "pk."
 * - Console will log [AnalyticsMap] messages to trace initialization.
 */
export function AnalyticsMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const initMap = useCallback(async () => {
    // === STEP 1: Validate token ===
    console.log(
      "[AnalyticsMap] Token check:",
      MAPBOX_TOKEN ? `"${MAPBOX_TOKEN.slice(0, 12)}…" (${MAPBOX_TOKEN.length} chars)` : "EMPTY/UNDEFINED",
    );

    if (!MAPBOX_TOKEN) {
      setErrorMsg(
        "Token missing. The NEXT_PUBLIC_MAPBOX_TOKEN env var was empty at compile time. " +
          "Delete .next/ and restart: rm -rf .next && npm run dev",
      );
      setStatus("error");
      return;
    }

    if (!MAPBOX_TOKEN.startsWith("pk.")) {
      setErrorMsg(`Token invalid — must start with "pk." but got "${MAPBOX_TOKEN.slice(0, 8)}…"`);
      setStatus("error");
      return;
    }

    // === STEP 2: Verify container ===
    const container = containerRef.current;
    if (!container) {
      setErrorMsg("Map container ref is null — component may not be mounted.");
      setStatus("error");
      return;
    }

    const rect = container.getBoundingClientRect();
    console.log("[AnalyticsMap] Container dimensions:", rect.width, "x", rect.height);

    if (rect.width === 0 || rect.height === 0) {
      setErrorMsg(`Container has zero dimensions (${rect.width}x${rect.height}). Check CSS.`);
      setStatus("error");
      return;
    }

    // === STEP 3: Load Mapbox GL ===
    try {
      console.log("[AnalyticsMap] Importing mapbox-gl...");
      const mapboxModule = await import("mapbox-gl");
      // Handle both ESM default and CJS module.exports patterns.
      const mapboxgl = mapboxModule.default ?? mapboxModule;
      console.log("[AnalyticsMap] mapbox-gl loaded, version:", mapboxgl.version);

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [85, 21],
        zoom: 3.4,
        attributionControl: true,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        console.log("[AnalyticsMap] Map loaded successfully");

        (Object.keys(KIND_COLORS) as RiskKind[]).forEach((kind) => {
          const color = KIND_COLORS[kind];
          const sourceId = `risk-${kind}`;

          map.addSource(sourceId, { type: "geojson", data: toGeoJSON(kind) });

          map.addLayer({
            id: `${sourceId}-heat`,
            type: "heatmap",
            source: sourceId,
            paint: {
              "heatmap-weight": ["get", "weight"],
              "heatmap-intensity": 1.1,
              "heatmap-radius": 46,
              "heatmap-opacity": 0.78,
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0, "rgba(0,0,0,0)",
                0.2, `${color}33`,
                0.5, `${color}99`,
                1, color,
              ],
            },
          });

          map.addLayer({
            id: `${sourceId}-point`,
            type: "circle",
            source: sourceId,
            paint: {
              "circle-radius": 4,
              "circle-color": color,
              "circle-blur": 0.3,
              "circle-opacity": 0.9,
            },
          });
        });

        setStatus("ready");
      });

      map.on("error", (e) => {
        console.error("[AnalyticsMap] Mapbox error:", e);
        setErrorMsg(`Mapbox runtime error: ${e.error?.message ?? "unknown"}`);
        setStatus("error");
      });

      // Cleanup on unmount.
      return () => {
        map.remove();
      };
    } catch (err) {
      console.error("[AnalyticsMap] Failed to initialize:", err);
      setErrorMsg(`Initialization failed: ${err instanceof Error ? err.message : String(err)}`);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    initMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "error") {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-danger)] bg-[var(--color-card)] p-8 text-center">
        <div className="max-w-lg">
          <p className="text-lg font-semibold text-[var(--color-danger)]">
            Map failed to load
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {errorMsg}
          </p>
          <p className="mt-4 font-mono text-xs text-[var(--color-text-muted)]">
            Token present: {MAPBOX_TOKEN ? "yes" : "no"} | Length: {MAPBOX_TOKEN.length} |
            Starts with pk.: {String(MAPBOX_TOKEN.startsWith("pk."))}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)]"
      style={{ height: "60vh", minHeight: "400px" }}
    >
      {/* Map canvas — explicit height ensures Mapbox can calculate dimensions */}
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface)]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-amber)]" />
            <p className="text-sm text-[var(--color-text-muted)]">Loading map…</p>
          </div>
        </div>
      )}
    </div>
  );
}
