"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, PencilLine, Sparkles, TriangleAlert } from "lucide-react";
import { ReportLocationMap } from "./ReportLocationMap";
import { reverseGeocodeLocation } from "./reportApi";
import type { ReportEvidenceFile, ReportLocationState } from "./reportTypes";

interface LocationStepProps {
  location: ReportLocationState;
  evidenceFiles: ReportEvidenceFile[];
  onLocationChange: (patch: Partial<ReportLocationState>) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export function LocationStep({ location, evidenceFiles, onLocationChange }: LocationStepProps) {
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [reverseLookupBusy, setReverseLookupBusy] = useState(false);

  const exifLocation = useMemo(
    () => evidenceFiles.find((file) => file.exifLocation)?.exifLocation ?? null,
    [evidenceFiles],
  );

  const applyCoordinates = useCallback(
    (latitude: number, longitude: number, locationMode: ReportLocationState["locationMode"]) => {
      onLocationChange({ latitude, longitude, locationMode });
    },
    [onLocationChange],
  );

  const detectGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingGps(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyCoordinates(position.coords.latitude, position.coords.longitude, "gps");
        setIsDetectingGps(false);
      },
      (error) => {
        setIsDetectingGps(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError("Location access denied. You can still drop the pin manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("Location unavailable. Try again or drag the marker.");
            break;
          case error.TIMEOUT:
            setGeoError("Location request timed out. Please try again.");
            break;
          default:
            setGeoError("Unable to detect your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [applyCoordinates]);

  useEffect(() => {
    if (location.latitude == null || location.longitude == null) {
      detectGpsLocation();
    }
  }, [detectGpsLocation, location.latitude, location.longitude]);

  useEffect(() => {
    if (location.latitude == null || location.longitude == null) {
      return;
    }

    let active = true;
    setReverseLookupBusy(true);
    const latitude = location.latitude;
    const longitude = location.longitude;

    const timer = setTimeout(() => {
      reverseGeocodeLocation({ latitude, longitude })
        .then((result) => {
          if (!active || !result) {
            return;
          }

          onLocationChange({
            address: result.label,
            locationMode: location.locationMode === "manual" ? "manual" : location.locationMode,
          });
        })
        .finally(() => {
          if (active) {
            setReverseLookupBusy(false);
          }
        });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [location.latitude, location.longitude, location.locationMode, onLocationChange]);

  const selectedExifLocation = useMemo(() => location.exifLocation ?? exifLocation, [exifLocation, location.exifLocation]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-[var(--color-text-primary)]">Location</label>
          {reverseLookupBusy && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--color-amber)_10%,transparent)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-amber)]">
              <Sparkles size={10} />
              Resolving address
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-neu)]">
          <div className="h-[350px] w-full">
            {location.latitude != null && location.longitude != null ? (
              <ReportLocationMap
                latitude={location.latitude}
                longitude={location.longitude}
                onChange={(latitude, longitude) => applyCoordinates(latitude, longitude, location.locationMode === "manual" ? "manual" : "gps")}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center">
                <div className="space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-amber)_12%,transparent)] text-[var(--color-amber)]">
                    <MapPin size={28} />
                  </div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Waiting for GPS or EXIF coordinates</p>
                  <button
                    type="button"
                    onClick={detectGpsLocation}
                    className="btn-outline inline-flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    <Navigation size={16} />
                    Detect my location
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {geoError && (
        <motion.div
          variants={itemVariants}
          className="flex items-start gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] px-4 py-3"
        >
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-[var(--color-danger)]" />
          <p className="text-xs text-[var(--color-danger)]">{geoError}</p>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Resolved Address</p>
          <p className="mt-2 text-sm text-[var(--color-text-primary)]">{location.address || "Resolving address from the selected pin…"}</p>
          {location.latitude != null && location.longitude != null && (
            <p className="mt-3 text-xs text-[var(--color-text-muted)] font-mono">{formatCoordinates(location.latitude, location.longitude)}</p>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Location source</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={detectGpsLocation}
              className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                location.locationMode === "gps"
                  ? "border-[var(--color-amber)] bg-[color-mix(in_srgb,var(--color-amber)_10%,transparent)] text-[var(--color-text-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
              }`}
            >
              Auto GPS
            </button>
            {selectedExifLocation && (
              <button
                type="button"
                onClick={() => {
                  onLocationChange({
                    latitude: selectedExifLocation.latitude,
                    longitude: selectedExifLocation.longitude,
                    address: selectedExifLocation.address ?? location.address,
                    locationMode: "exif",
                    useExifLocation: true,
                    exifLocation: selectedExifLocation,
                  });
                }}
                className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                  location.locationMode === "exif"
                    ? "border-[var(--color-amber)] bg-[color-mix(in_srgb,var(--color-amber)_10%,transparent)] text-[var(--color-text-primary)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
                }`}
              >
                Use photo EXIF location
              </button>
            )}
            <button
              type="button"
              onClick={() => onLocationChange({ locationMode: "manual" })}
              className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                location.locationMode === "manual"
                  ? "border-[var(--color-amber)] bg-[color-mix(in_srgb,var(--color-amber)_10%,transparent)] text-[var(--color-text-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
              }`}
            >
              Manual pin
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <label htmlFor="report-landmark" className="mb-2 block text-sm font-semibold text-[var(--color-text-primary)]">
          Landmark override
        </label>
        <div className="relative">
          <PencilLine size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            id="report-landmark"
            type="text"
            value={location.landmark}
            onChange={(event) => onLocationChange({ landmark: event.target.value })}
            placeholder="Nearby landmark, shop, or junction"
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-amber)_24%,transparent)]"
          />
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          {location.locationMode === "exif"
            ? "The map is using location metadata embedded in your photo."
            : "Drag the pin to fine-tune the location if needed."}
        </p>
      </motion.div>
    </motion.div>
  );
}
