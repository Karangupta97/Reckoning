"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, X, RefreshCw } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

/**
 * A dismissible install banner that appears at the top of the citizen dashboard.
 * Also shows an update-available banner when a new service worker is waiting.
 */
export function PWAInstallBanner() {
  const { mode, canInstall, install, dismissed, dismiss, updateAvailable, applyUpdate } =
    usePWAInstall();

  // Update banner takes priority
  if (updateAvailable) {
    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-500/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <RefreshCw size={14} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm text-[var(--color-text-primary)] truncate">
              <span className="font-medium">Update available!</span>{" "}
              <span className="text-[var(--color-text-secondary)]">
                A new version of Reckoning is ready.
              </span>
            </p>
          </div>
          <button
            onClick={applyUpdate}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
          >
            Update Now
          </button>
        </div>
      </motion.div>
    );
  }

  // Don't show install banner if dismissed, already installed, or unsupported
  if (dismissed || !canInstall) return null;

  const handleInstall = async () => {
    if (mode === "prompt") {
      await install();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-blue-500/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Download size={14} className="text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-[var(--color-text-primary)] truncate">
              <span className="font-medium">Install Reckoning</span>{" "}
              <span className="hidden sm:inline text-[var(--color-text-secondary)]">
                {mode === "ios"
                  ? "— Add to Home Screen for offline access"
                  : "— Get the full app experience with offline support"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {mode === "prompt" && (
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Install
              </button>
            )}
            {mode === "ios" && (
              <span className="hidden sm:inline text-xs text-blue-600 dark:text-blue-400 font-medium">
                Use Safari → Share → Add to Home Screen
              </span>
            )}
            <button
              onClick={dismiss}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface)] transition-colors"
              aria-label="Dismiss install banner"
            >
              <X size={14} className="text-[var(--color-text-muted)]" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
