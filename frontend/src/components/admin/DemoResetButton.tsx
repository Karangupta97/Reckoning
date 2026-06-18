"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { resetDemoData, hasModifiedData } from "@/lib/demo-reset";

/**
 * Demo Data Reset button with confirmation dialog.
 * Clears all stores and reloads to fresh seed data.
 */
export function DemoResetButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const modified = hasModifiedData();

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 h-9 px-4 rounded-lg border text-xs font-medium transition-colors"
        style={{
          borderColor: "rgba(239,68,68,0.3)",
          background: "rgba(239,68,68,0.08)",
          color: "#ef4444",
        }}
      >
        <RotateCcw size={14} />
        Reset Demo Data
        {modified && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        )}
      </motion.button>

      {/* Confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border p-6"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Reset Demo Data?</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">This cannot be undone</p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mb-5 leading-relaxed">
                This will clear all modified data (complaints, escalations, evidence, budgets, achievements, leaderboards)
                and reload with fresh seed data. Use this to replay the full workflow from scratch.
              </p>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="h-8 px-4 rounded-lg border text-xs font-medium text-[var(--color-text-secondary)]"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={resetDemoData}
                  className="h-8 px-4 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  Reset All Data
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
