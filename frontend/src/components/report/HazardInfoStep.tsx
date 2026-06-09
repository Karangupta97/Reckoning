"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CircleHelp,
  Droplets,
  TreePine,
  Construction,
  TrafficCone,
  Sparkles,
} from "lucide-react";
import {
  HAZARD_OPTIONS,
  HAZARD_LABEL_BY_VALUE,
  SEVERITY_OPTIONS,
  type ReportAiAnalysisResult,
  type ReportFieldSuggestionState,
  type ReportHazardType,
  type ReportSeverityLevel,
} from "./reportTypes";

const HAZARD_ICONS: Record<ReportHazardType, React.ElementType> = {
  pothole: AlertTriangle,
  flooding: Droplets,
  fallenTree: TreePine,
  roadDebris: Construction,
  brokenSignal: TrafficCone,
  other: CircleHelp,
};

const severityLeftBorder: Record<ReportSeverityLevel, string> = {
  low: "border-l-[var(--color-success)]",
  medium: "border-l-[var(--color-amber)]",
  high: "border-l-orange-500",
  critical: "border-l-[var(--color-danger)]",
};

interface HazardInfoStepProps {
  hazardType: ReportHazardType | "";
  severity: ReportSeverityLevel | "";
  title: string;
  description: string;
  aiResult: ReportAiAnalysisResult | null;
  fieldSuggestions: ReportFieldSuggestionState;
  onHazardTypeChange: (value: ReportHazardType) => void;
  onSeverityChange: (value: ReportSeverityLevel) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

function AIBadge({ visible }: { visible: boolean }) {
  if (!visible) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--color-amber)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-amber)_10%,transparent)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-amber)]">
      <Sparkles size={10} />
      AI suggested
    </span>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

export function HazardInfoStep({
  hazardType,
  severity,
  title,
  description,
  aiResult,
  fieldSuggestions,
  onHazardTypeChange,
  onSeverityChange,
  onTitleChange,
  onDescriptionChange,
}: HazardInfoStepProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-[var(--color-text-primary)]">
            Hazard Type
          </label>
          <AIBadge visible={fieldSuggestions.hazardType === "ai"} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {HAZARD_OPTIONS.map((option) => {
            const Icon = HAZARD_ICONS[option.value];
            const isSelected = hazardType === option.value;
            const isSuggested = aiResult?.suggestedCategory === option.value && fieldSuggestions.hazardType === "ai";

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onHazardTypeChange(option.value)}
                aria-pressed={isSelected}
                className={`group relative flex min-h-[96px] flex-col items-start justify-between rounded-2xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-[var(--color-amber)] bg-[color-mix(in_srgb,var(--color-amber)_10%,transparent)] shadow-[var(--shadow-neu)]"
                    : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-amber)]/40 hover:bg-[var(--color-surface)]"
                }`}
              >
                <span className="flex w-full items-start justify-between gap-2">
                  <Icon
                    size={20}
                    className={isSelected ? "text-[var(--color-amber)]" : "text-[var(--color-text-muted)]"}
                    strokeWidth={1.8}
                  />
                  {isSelected && (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-amber)] text-white shadow-sm">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <div className="space-y-1.5">
                  <span className={`text-sm font-semibold ${isSelected ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>
                    {option.label}
                  </span>
                  {isSuggested && <AIBadge visible />}
                </div>
                <div
                  className={`absolute inset-y-0 left-0 w-1 rounded-r-full bg-[var(--color-amber)] transition-opacity ${
                    isSelected ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-[var(--color-text-primary)]">
            Severity Level
          </label>
          <AIBadge visible={fieldSuggestions.severity === "ai"} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SEVERITY_OPTIONS.map((option) => {
            const isSelected = severity === option.value;
            const severityBadge = option.value === "low" ? "var(--color-success)" : option.value === "medium" ? "var(--color-amber)" : option.value === "high" ? "#f97316" : "var(--color-danger)";

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSeverityChange(option.value)}
                aria-pressed={isSelected}
                className={`rounded-2xl border-l-4 p-3 text-left transition-all ${severityLeftBorder[option.value]} ${
                  isSelected
                    ? "border-[var(--color-amber)] bg-[color-mix(in_srgb,var(--color-amber)_10%,transparent)] shadow-[var(--shadow-neu)]"
                    : "border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-amber)]/40 hover:bg-[var(--color-surface)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold ${isSelected ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>
                    {option.label}
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: severityBadge }} />
                </div>
                <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                  {option.value === "low"
                    ? "Minor inconvenience"
                    : option.value === "medium"
                      ? "Moderate risk"
                      : option.value === "high"
                        ? "Significant danger"
                        : "Immediate threat"}
                </p>
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="report-title" className="text-sm font-semibold text-[var(--color-text-primary)]">
            Hazard Title
          </label>
          <AIBadge visible={fieldSuggestions.title === "ai"} />
        </div>
        <input
          id="report-title"
          type="text"
          value={title}
          maxLength={120}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Large pothole near the junction"
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-amber)_24%,transparent)]"
        />
        <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
          <span>{aiResult?.message ?? "Use the AI suggestion or edit it."}</span>
          <span>{title.length}/120</span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="report-description" className="text-sm font-semibold text-[var(--color-text-primary)]">
            Description
          </label>
          <AIBadge visible={fieldSuggestions.description === "ai"} />
        </div>
        <textarea
          id="report-description"
          value={description}
          maxLength={500}
          rows={5}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Describe what happened, how serious it looks, and what nearby drivers should know."
          className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-amber)_24%,transparent)]"
        />
        <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
          <span>Summarise the hazard in a clear sentence or two.</span>
          <span>{description.length}/500</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
