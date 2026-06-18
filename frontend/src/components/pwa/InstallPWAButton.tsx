"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Smartphone, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

interface InstallPWAButtonProps {
  /** Visual variant */
  variant?: "default" | "hero" | "compact";
  /** Custom class overrides */
  className?: string;
}

/**
 * Install App button that adapts to the device:
 * - Android/Desktop Chrome: triggers `beforeinstallprompt`
 * - iOS Safari: shows instruction modal
 * - Already installed: hidden
 */
export function InstallPWAButton({ variant = "default", className = "" }: InstallPWAButtonProps) {
  const { mode, canInstall, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (!canInstall) return null;

  const handleClick = async () => {
    if (mode === "prompt") {
      await install();
    } else if (mode === "ios") {
      setShowIOSModal(true);
    }
  };

  const baseStyles = {
    default:
      "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm",
    hero:
      "inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 transition-all",
    compact:
      "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20",
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleClick}
        className={`${baseStyles[variant]} ${className}`}
        aria-label="Install Reckoning app"
      >
        <Download size={variant === "hero" ? 18 : 15} strokeWidth={2.5} />
        <span>Install App</span>
      </motion.button>

      {/* iOS Instructions Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowIOSModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-[var(--color-card)] rounded-2xl p-6 shadow-2xl border border-[var(--color-border)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Smartphone size={20} className="text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Install Reckoning
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface)] transition-colors"
                  aria-label="Close"
                >
                  <X size={16} className="text-[var(--color-text-muted)]" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Install Reckoning on your iPhone or iPad for a full-screen app experience:
                </p>

                <ol className="space-y-3 text-sm text-[var(--color-text-primary)]">
                  <li className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span>
                      Tap the <strong>Share</strong> button{" "}
                      <span className="inline-block w-5 h-5 align-middle text-center bg-[var(--color-surface)] rounded border border-[var(--color-border)] text-xs leading-5">
                        ↑
                      </span>{" "}
                      in Safari&apos;s toolbar
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <span>
                      Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <span>
                      Tap <strong>&quot;Add&quot;</strong> to install
                    </span>
                  </li>
                </ol>

                <div className="pt-2 border-t border-[var(--color-border)]">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    The app will appear on your home screen with full offline support.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
