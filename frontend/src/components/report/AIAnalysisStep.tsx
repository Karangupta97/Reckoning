"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Sparkles, TriangleAlert } from "lucide-react";
import type { ReportAnalysisState } from "./reportTypes";

const STATUS_LINES = ["Scanning image…", "Detecting defects…", "Assessing severity…"];

interface AIAnalysisStepProps {
  analysisState: ReportAnalysisState;
  analysisStatusIndex: number;
  analysisError: string | null;
  previewUrl: string | null;
  onContinueManually: () => void;
  onDismissError: () => void;
}

export function AIAnalysisStep({
  analysisState,
  analysisStatusIndex,
  analysisError,
  previewUrl,
  onContinueManually,
  onDismissError,
}: AIAnalysisStepProps) {
  const statusLine = STATUS_LINES[analysisStatusIndex % STATUS_LINES.length];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-neu)]">
        <div className="relative mx-auto aspect-[4/3] max-w-xl overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]">
          {previewUrl ? (
            <img src={previewUrl} alt="First uploaded evidence" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
              <Sparkles size={28} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(11,13,18,0.28)]" />
          <motion.div
            animate={{ opacity: [0.35, 0.95, 0.35], scale: [1, 1.02, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-[1.5rem] border-2 border-[var(--color-amber)]"
          />
          <motion.div
            animate={{ y: ["12%", "78%", "12%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-4 right-4 h-1 rounded-full bg-[color-mix(in_srgb,var(--color-amber)_45%,transparent)] shadow-[0_0_24px_rgba(245,158,11,0.6)]"
          />
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            <Sparkles size={14} className="text-[var(--color-amber)]" />
            AI scanning
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-amber)_12%,transparent)] text-[var(--color-amber)]"
          >
            <Sparkles size={18} />
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{statusLine}</p>
            <p className="text-xs text-[var(--color-text-muted)]">The analysis result will pre-fill the next step automatically.</p>
          </div>
        </div>
      </div>

      {analysisError && (
        <div className="rounded-[1.5rem] border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-4">
          <div className="flex items-start gap-3">
            <TriangleAlert size={16} className="mt-0.5 shrink-0 text-[var(--color-danger)]" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--color-danger)]">AI analysis unavailable</p>
              <p className="mt-1 text-xs text-[var(--color-danger)]">{analysisError}</p>
            </div>
            <button type="button" onClick={onDismissError} className="text-xs font-semibold text-[var(--color-danger)]">
              Dismiss
            </button>
          </div>
          <button type="button" onClick={onContinueManually} className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <AlertTriangle size={14} />
            Continue manually
          </button>
        </div>
      )}

      {analysisState === "ready" && !analysisError && (
        <div className="flex items-center gap-3 rounded-[1.5rem] border border-[color-mix(in_srgb,var(--color-success)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)] p-4">
          <CheckCircle2 size={18} className="text-[var(--color-success)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-success)]">Analysis complete</p>
            <p className="text-xs text-[var(--color-text-muted)]">Your hazard fields are already pre-filled. Move to the next step.</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
