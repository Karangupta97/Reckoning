"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { MyReport } from "./types";
import { ReportDetailPanel } from "./ReportDetailPanel";

interface ReportDetailSheetProps {
  report: MyReport | null;
  onClose: () => void;
  onDelete?: (report: MyReport) => void;
  onToggleNotify?: (report: MyReport) => void;
}

export function ReportDetailSheet({ report, onClose, onDelete, onToggleNotify }: ReportDetailSheetProps) {
  return (
    <AnimatePresence>
      {report && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          />

          {/* Bottom Sheet (mobile/tablet) */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-card)] rounded-t-2xl h-[75dvh] lg:hidden overflow-hidden"
          >
            {/* Drag handle */}
            <div className="sticky top-0 z-10 bg-[var(--color-card)] pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--color-border)] mx-auto" />
            </div>
            <ReportDetailPanel
              report={report}
              onClose={onClose}
              onDelete={onDelete}
              onToggleNotify={onToggleNotify}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Desktop Detail Panel (right column) ─────────────────────── */
export function DesktopDetailPanel({ report, onClose, onDelete, onToggleNotify }: ReportDetailSheetProps) {
  return (
    <AnimatePresence>
      {report && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="hidden lg:block w-[380px] flex-shrink-0 h-full border-l border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden"
        >
          <ReportDetailPanel
            report={report}
            onClose={onClose}
            onDelete={onDelete}
            onToggleNotify={onToggleNotify}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
