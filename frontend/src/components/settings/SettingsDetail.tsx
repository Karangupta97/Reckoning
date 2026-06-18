"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { SettingsCategory } from "./types";
import { CATEGORIES } from "./SettingsSidebar";
import { AccountPanel } from "./panels/AccountPanel";
import { NotificationsPanel } from "./panels/NotificationsPanel";
import { PrivacyPanel } from "./panels/PrivacyPanel";
import { LanguagePanel } from "./panels/LanguagePanel";
import { AppearancePanel } from "./panels/AppearancePanel";
import { PWAPanel } from "./panels/PWAPanel";
import { LocationPanel } from "./panels/LocationPanel";
import { DataPanel } from "./panels/DataPanel";
import { SupportPanel } from "./panels/SupportPanel";
import { AbusePanel } from "./panels/AbusePanel";
import { LogoutPanel } from "./panels/LogoutPanel";
import { SettingsToast } from "./SettingsToast";
import { useSettingsStore } from "../../store/settingsStore";
import { useState, useCallback } from "react";

const PANEL_MAP: Record<SettingsCategory, React.FC> = {
  account: AccountPanel,
  notifications: NotificationsPanel,
  privacy: PrivacyPanel,
  language: LanguagePanel,
  appearance: AppearancePanel,
  pwa: PWAPanel,
  location: LocationPanel,
  data: DataPanel,
  support: SupportPanel,
  abuse: AbusePanel,
  logout: LogoutPanel,
};

// Categories that show save/discard actions
const SAVEABLE_CATEGORIES: SettingsCategory[] = [
  "account",
  "notifications",
  "privacy",
  "language",
  "appearance",
  "pwa",
  "location",
  "data",
];

interface SettingsDetailProps {
  category: SettingsCategory;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function SettingsDetail({ category, onBack, showBackButton = false }: SettingsDetailProps) {
  const { hasUnsavedChanges, setHasUnsavedChanges, isSaving, setIsSaving } = useSettingsStore();
  const [showToast, setShowToast] = useState(false);

  const activeCat = CATEGORIES.find((c) => c.id === category);
  const Panel = PANEL_MAP[category];
  const showSaveBar = hasUnsavedChanges && SAVEABLE_CATEGORIES.includes(category);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  }, [setHasUnsavedChanges, setIsSaving]);

  const handleDiscard = useCallback(() => {
    setHasUnsavedChanges(false);
  }, [setHasUnsavedChanges]);

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-[var(--color-page)] relative">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-5 lg:px-8 pt-5 pb-3 border-b border-[var(--color-border)]/50">
        {showBackButton && onBack && (
          <motion.button
            onClick={onBack}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 -ml-1 rounded-xl flex items-center justify-center
              text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]
              transition-all duration-150 shrink-0"
            aria-label="Back to categories"
          >
            <ArrowLeft size={20} strokeWidth={1.8} />
          </motion.button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] truncate">
            {activeCat?.label}
          </h2>
          <p className="text-[11px] text-[var(--color-text-muted)] truncate">
            {activeCat?.description}
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 lg:px-8 py-5 pb-36">
        <AnimatePresence mode="wait">
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <Panel />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Save/Discard bar */}
      <AnimatePresence>
        {showSaveBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50
              flex items-center gap-3 px-5 py-3 rounded-2xl
              bg-[var(--color-card)] border border-[var(--color-border)]
              shadow-xl backdrop-blur-md"
          >
            <button
              onClick={handleDiscard}
              disabled={isSaving}
              className="px-4 py-2 text-[13px] font-medium text-[var(--color-text-muted)]
                rounded-xl hover:bg-[var(--color-surface)] active:scale-95
                transition-all duration-200 disabled:opacity-50"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 text-[13px] font-semibold text-[#1c2b3a]
                bg-[var(--color-amber)] rounded-xl
                hover:brightness-105 active:scale-95
                transition-all duration-200 shadow-sm
                disabled:opacity-70"
            >
              {isSaving && (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 size={14} />
                </motion.span>
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsToast show={showToast} />
    </div>
  );
}
