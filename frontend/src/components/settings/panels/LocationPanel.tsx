"use client";

import { MapPin, Navigation } from "lucide-react";
import { SettingsSection } from "../SettingsSection";
import { SettingsToggle } from "../SettingsToggle";
import { SettingsSelect } from "../SettingsSelect";
import { useSettingsStore } from "../../../store/settingsStore";

const FEED_SCOPE_OPTIONS = [
  { value: "sub-district", label: "Sub-District" },
  { value: "district", label: "District" },
  { value: "state", label: "State" },
  { value: "national", label: "National" },
];

const ACCURACY_OPTIONS = [
  { value: "high", label: "High (GPS)" },
  { value: "balanced", label: "Balanced" },
  { value: "low", label: "Low (Battery Saver)" },
];

export function LocationPanel() {
  const { autoDetectLocation, feedScope, locationAccuracy, setField } = useSettingsStore();

  return (
    <div>
      <SettingsSection title="Location Services" description="Control how the app uses your location.">
        <SettingsToggle
          label="Auto Detect Location"
          description="Use device GPS to determine your area"
          enabled={autoDetectLocation}
          onChange={(v) => setField("autoDetectLocation", v)}
        />
        <SettingsSelect
          label="Location Accuracy"
          value={locationAccuracy}
          onChange={(v) => setField("locationAccuracy", v as "high" | "balanced" | "low")}
          options={ACCURACY_OPTIONS}
          description="Higher accuracy uses more battery"
        />
      </SettingsSection>

      <SettingsSection title="Feed Scope" description="Default area for your hazard feed.">
        <SettingsSelect
          label="Default Feed Scope"
          value={feedScope}
          onChange={(v) => setField("feedScope", v as "sub-district" | "district" | "state" | "national")}
          options={FEED_SCOPE_OPTIONS}
          description="Area covered by your home feed"
        />
      </SettingsSection>

      <SettingsSection title="Current Location">
        <div className="py-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <span className="shrink-0 w-9 h-9 rounded-lg bg-[var(--color-amber)]/10 flex items-center justify-center text-[var(--color-amber)]">
              <Navigation size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                Pune, Maharashtra
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Detected automatically
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Saved Locations">
        <div className="py-3.5 space-y-2.5">
          {[
            { name: "Home", address: "123 Main Street, Haveli" },
            { name: "Office", address: "Tech Park, Hinjewadi" },
          ].map((loc) => (
            <div key={loc.name} className="flex items-center gap-3">
              <span className="shrink-0 w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)]">
                <MapPin size={14} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{loc.name}</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">{loc.address}</p>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
