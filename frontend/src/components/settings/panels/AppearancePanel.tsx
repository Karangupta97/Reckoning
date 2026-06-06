"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { SettingsSection } from "../SettingsSection";
import { SettingsToggle } from "../SettingsToggle";
import { SettingsSelect } from "../SettingsSelect";
import { useSettingsStore } from "../../../store/settingsStore";

const THEME_OPTIONS: Array<{
  id: "light" | "dark" | "system";
  label: string;
  icon: React.ElementType;
  previewBg: string;
  previewCard: string;
}> = [
  { id: "light", label: "Light", icon: Sun, previewBg: "#EFF2F9", previewCard: "#FFFFFF" },
  { id: "dark", label: "Dark", icon: Moon, previewBg: "#1A1F2E", previewCard: "#222838" },
  { id: "system", label: "System", icon: Monitor, previewBg: "linear-gradient(135deg, #EFF2F9 50%, #1A1F2E 50%)", previewCard: "" },
];

const FONT_SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export function AppearancePanel() {
  const { theme, compactMode, reducedMotion, highContrast, fontSize, setField } = useSettingsStore();

  return (
    <div>
      <SettingsSection title="Theme" description="Choose your preferred color scheme.">
        <div className="py-4">
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => {
              const isActive = theme === opt.id;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.id}
                  onClick={() => setField("theme", opt.id)}
                  className={`
                    relative flex flex-col items-center gap-2.5 rounded-2xl p-3 pb-3.5
                    border-2 transition-all duration-200
                    ${isActive
                      ? "border-[var(--color-amber)] shadow-sm"
                      : "border-[var(--color-border)] hover:border-[var(--color-text-muted)]/50"
                    }
                  `}
                >
                  {/* Theme Preview */}
                  <div
                    className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-[var(--color-border)]/50"
                    style={{
                      background: opt.previewBg.includes("gradient") ? opt.previewBg : opt.previewBg,
                    }}
                  >
                    {opt.previewCard && (
                      <div
                        className="mx-auto mt-2 w-3/4 h-2 rounded-full"
                        style={{ backgroundColor: opt.previewCard, opacity: 0.8 }}
                      />
                    )}
                  </div>

                  {/* Icon + Label */}
                  <div className="flex items-center gap-1.5">
                    <Icon
                      size={14}
                      className={isActive ? "text-[var(--color-amber)]" : "text-[var(--color-text-muted)]"}
                    />
                    <span
                      className={`text-xs font-medium ${
                        isActive ? "text-[var(--color-amber)]" : "text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {opt.label}
                    </span>
                  </div>

                  {/* Check mark */}
                  {isActive && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-amber)] flex items-center justify-center"
                    >
                      <Check size={10} strokeWidth={3} className="text-white" />
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Display" description="Adjust visual preferences.">
        <SettingsSelect
          label="Font Size"
          value={fontSize}
          onChange={(v) => setField("fontSize", v as "small" | "medium" | "large")}
          options={FONT_SIZE_OPTIONS}
          description="Text size throughout the app"
        />
        <SettingsToggle
          label="Compact Mode"
          description="Reduce padding and spacing for denser layouts"
          enabled={compactMode}
          onChange={(v) => setField("compactMode", v)}
        />
        <SettingsToggle
          label="Reduced Motion"
          description="Minimize animations for accessibility"
          enabled={reducedMotion}
          onChange={(v) => setField("reducedMotion", v)}
        />
        <SettingsToggle
          label="High Contrast"
          description="Increase contrast for better readability"
          enabled={highContrast}
          onChange={(v) => setField("highContrast", v)}
        />
      </SettingsSection>
    </div>
  );
}
