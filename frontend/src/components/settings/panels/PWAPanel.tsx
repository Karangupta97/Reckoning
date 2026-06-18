"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, RefreshCw, Trash2 } from "lucide-react";
import { SettingsSection } from "../SettingsSection";
import { SettingsToggle } from "../SettingsToggle";
import { useSettingsStore } from "../../../store/settingsStore";

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 py-3.5">
      {ok ? (
        <CheckCircle size={16} className="text-[var(--color-success)] shrink-0" />
      ) : (
        <XCircle size={16} className="text-[var(--color-text-muted)] shrink-0" />
      )}
      <span className="text-[13px] font-medium text-[var(--color-text-primary)] flex-1">
        {label}
      </span>
      <span
        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
          ok
            ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
            : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
        }`}
      >
        {ok ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

export function PWAPanel() {
  const { offlineMode, backgroundSync, setField } = useSettingsStore();
  const [isInstalled, setIsInstalled] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>("default");

  useEffect(() => {
    // Check PWA install status
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Check push permission
    if ("Notification" in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  return (
    <div>
      <SettingsSection title="App Status" description="Current PWA installation and permissions.">
        <StatusBadge ok={isInstalled} label="App Installed" />
        <StatusBadge ok={pushPermission === "granted"} label="Push Permission" />
        <StatusBadge ok={backgroundSync} label="Background Sync" />
        <StatusBadge ok={offlineMode} label="Offline Mode" />
      </SettingsSection>

      <SettingsSection title="Sync & Offline" description="Control background data sync.">
        <SettingsToggle
          label="Offline Mode"
          description="Cache reports and map data for offline access"
          enabled={offlineMode}
          onChange={(v) => setField("offlineMode", v)}
        />
        <SettingsToggle
          label="Background Sync"
          description="Auto-submit pending reports when back online"
          enabled={backgroundSync}
          onChange={(v) => setField("backgroundSync", v)}
        />
      </SettingsSection>

      <SettingsSection title="Storage & Cache">
        <div className="py-4 space-y-3">
          {/* Storage bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                Storage Used
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                24.8 MB / 100 MB
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--color-surface)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-amber)] to-orange-400 transition-all duration-500"
                style={{ width: "25%" }}
              />
            </div>
          </div>

          {/* Cache usage breakdown */}
          <div className="space-y-1.5 pt-2">
            {[
              { label: "Map tiles", size: "12.1 MB" },
              { label: "Report images", size: "8.2 MB" },
              { label: "Language packs", size: "2.4 MB" },
              { label: "App data", size: "2.1 MB" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--color-text-secondary)]">{item.label}</span>
                <span className="text-[11px] text-[var(--color-text-muted)] font-mono">{item.size}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-3">
            <button className="flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium
              text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-xl
              hover:bg-[var(--color-surface)] active:scale-95 transition-all duration-200">
              <RefreshCw size={13} />
              Check Updates
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium
              text-[var(--color-danger)] border border-[var(--color-danger)]/30 rounded-xl
              hover:bg-[var(--color-danger)]/5 active:scale-95 transition-all duration-200">
              <Trash2 size={13} />
              Clear Cache
            </button>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
