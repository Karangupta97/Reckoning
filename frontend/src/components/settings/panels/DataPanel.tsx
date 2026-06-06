"use client";

import { Download, Trash2, HardDrive } from "lucide-react";
import { SettingsSection } from "../SettingsSection";
import { SettingsToggle } from "../SettingsToggle";
import { useSettingsStore } from "../../../store/settingsStore";

export function DataPanel() {
  const { autoSync, dataSaver, setField } = useSettingsStore();

  return (
    <div>
      <SettingsSection title="Sync" description="Control data synchronization.">
        <SettingsToggle
          label="Auto Sync"
          description="Automatically sync pending data when connected"
          enabled={autoSync}
          onChange={(v) => setField("autoSync", v)}
        />
        <SettingsToggle
          label="Data Saver"
          description="Reduce image quality and preloading to save bandwidth"
          enabled={dataSaver}
          onChange={(v) => setField("dataSaver", v)}
        />
      </SettingsSection>

      <SettingsSection title="Storage Breakdown" description="How your storage is being used.">
        <div className="py-4 space-y-3">
          {[
            { label: "Reports Stored Offline", size: "14 reports", icon: HardDrive },
            { label: "Downloaded Languages", size: "2 packs (4.8 MB)", icon: Download },
            { label: "Cached Maps", size: "12.1 MB", icon: HardDrive },
            { label: "Media Storage", size: "8.2 MB", icon: HardDrive },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <span className="shrink-0 w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)]">
                  <Icon size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{item.label}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">{item.size}</p>
                </div>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection title="Actions">
        <div className="py-4 space-y-2.5">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
            text-left text-[13px] font-medium text-[var(--color-text-primary)]
            border border-[var(--color-border)] hover:bg-[var(--color-surface)]
            active:scale-[0.98] transition-all duration-200">
            <Download size={16} className="text-[var(--color-text-muted)]" />
            <div>
              <p>Export My Data</p>
              <p className="text-[11px] text-[var(--color-text-muted)] font-normal">Download all your account data</p>
            </div>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
            text-left text-[13px] font-medium text-[var(--color-text-secondary)]
            border border-[var(--color-border)] hover:bg-[var(--color-surface)]
            active:scale-[0.98] transition-all duration-200">
            <Trash2 size={16} className="text-[var(--color-text-muted)]" />
            <div>
              <p>Clear Downloads</p>
              <p className="text-[11px] text-[var(--color-text-muted)] font-normal">Remove offline language packs and maps</p>
            </div>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
            text-left text-[13px] font-medium text-[var(--color-danger)]
            border border-[var(--color-danger)]/20 hover:bg-[var(--color-danger)]/5
            active:scale-[0.98] transition-all duration-200">
            <Trash2 size={16} className="text-[var(--color-danger)]" />
            <div>
              <p>Clear All Cache</p>
              <p className="text-[11px] text-[var(--color-text-muted)] font-normal">Remove all cached data (24.8 MB)</p>
            </div>
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
