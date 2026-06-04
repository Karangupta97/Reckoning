"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Pencil, Loader2 } from "lucide-react";
import { useReportStore } from "@/store/reportStore";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function LocationStep() {
  const { formData, updateForm } = useReportStore();
  const [isDetecting, setIsDetecting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateForm({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          locationMethod: "auto",
        });
        setIsDetecting(false);
      },
      (error) => {
        setIsDetecting(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError("Location access denied. Please enable GPS or enter manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("Location unavailable. Try again or enter manually.");
            break;
          case error.TIMEOUT:
            setGeoError("Location request timed out. Please try again.");
            break;
          default:
            setGeoError("Unable to detect location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [updateForm]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Location Method Toggle */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Location Method
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              updateForm({ locationMethod: "auto" });
              detectLocation();
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
              formData.locationMethod === "auto"
                ? "border-[var(--color-amber)] bg-[color-mix(in_srgb,var(--color-amber)_8%,transparent)] shadow-[var(--shadow-neu)]"
                : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-text-muted)]"
            }`}
          >
            <Navigation size={18} strokeWidth={1.8} />
            <span className="text-sm font-medium">Auto Detect</span>
          </button>
          <button
            type="button"
            onClick={() => updateForm({ locationMethod: "manual" })}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
              formData.locationMethod === "manual"
                ? "border-[var(--color-amber)] bg-[color-mix(in_srgb,var(--color-amber)_8%,transparent)] shadow-[var(--shadow-neu)]"
                : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-text-muted)]"
            }`}
          >
            <Pencil size={18} strokeWidth={1.8} />
            <span className="text-sm font-medium">Manual</span>
          </button>
        </div>
      </motion.div>

      {/* GPS Auto-detect */}
      {formData.locationMethod === "auto" && (
        <motion.div variants={itemVariants} className="space-y-4">
          {!formData.latitude && !isDetecting && (
            <button
              type="button"
              onClick={detectLocation}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] transition-all duration-200"
            >
              <MapPin size={20} />
              <span className="text-sm font-medium">Tap to detect your GPS location</span>
            </button>
          )}

          {isDetecting && (
            <div className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <Loader2 size={20} className="animate-spin text-[var(--color-amber)]" />
              <span className="text-sm text-[var(--color-text-secondary)]">
                Detecting your location...
              </span>
            </div>
          )}

          {geoError && (
            <div className="px-4 py-3 rounded-xl bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)]">
              <p className="text-xs text-[var(--color-danger)]">{geoError}</p>
            </div>
          )}

          {formData.latitude && formData.longitude && (
            <div className="space-y-3">
              {/* Map Preview Placeholder */}
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                  <MapPin size={32} className="text-[var(--color-amber)]" />
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </span>
                </div>
                {/* Decorative grid */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }} />
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-success)_25%,transparent)]">
                <Navigation size={14} className="text-[var(--color-success)]" />
                <span className="text-xs text-[var(--color-success)] font-medium">
                  Location detected successfully
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Address Input */}
      <motion.div variants={itemVariants}>
        <label
          htmlFor="report-address"
          className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2"
        >
          Address {formData.locationMethod === "manual" && <span className="text-[var(--color-danger)]">*</span>}
        </label>
        <input
          id="report-address"
          type="text"
          value={formData.address}
          onChange={(e) => updateForm({ address: e.target.value })}
          placeholder="Enter full address or nearby landmark"
          className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)] focus:border-transparent transition-shadow"
        />
      </motion.div>

      {/* Road / Landmark */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div variants={itemVariants}>
          <label
            htmlFor="report-road"
            className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2"
          >
            Road / Highway
          </label>
          <input
            id="report-road"
            type="text"
            value={formData.road}
            onChange={(e) => updateForm({ road: e.target.value })}
            placeholder="e.g., NH-48, Mumbai-Pune Expressway"
            className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)] focus:border-transparent transition-shadow"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <label
            htmlFor="report-landmark"
            className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2"
          >
            Nearby Landmark
          </label>
          <input
            id="report-landmark"
            type="text"
            value={formData.landmark}
            onChange={(e) => updateForm({ landmark: e.target.value })}
            placeholder="e.g., Near Kharghar Station"
            className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)] focus:border-transparent transition-shadow"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
