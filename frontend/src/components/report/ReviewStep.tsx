"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Edit3, FileImage, MapPin, Sparkles } from "lucide-react";
import {
  BACKEND_CATEGORY_BY_HAZARD,
  HAZARD_LABEL_BY_VALUE,
  SEVERITY_OPTIONS,
  type ReportAiAnalysisResult,
  type ReportEvidenceFile,
  type ReportHazardType,
  type ReportLocationState,
  type ReportSeverityLevel,
} from "./reportTypes";

interface ReviewStepProps {
  evidenceFiles: ReportEvidenceFile[];
  aiResult: ReportAiAnalysisResult | null;
  hazardType: ReportHazardType | "";
  severity: ReportSeverityLevel | "";
  title: string;
  description: string;
  location: ReportLocationState;
  onEditStep: (step: 1 | 2 | 3 | 4) => void;
}

const severityColor: Record<ReportSeverityLevel, string> = {
  low: "var(--color-success)",
  medium: "var(--color-amber)",
  high: "#f97316",
  critical: "var(--color-danger)",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

function scoreFromAi(aiResult: ReportAiAnalysisResult | null): number {
  if (!aiResult?.confidence) {
    return aiResult?.totalDetected ? Math.min(100, aiResult.totalDetected * 28) : 20;
  }

  return Math.round(Math.max(10, Math.min(100, aiResult.confidence * 100)));
}

function MiniGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 18;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <svg viewBox="0 0 48 48" className="h-16 w-16 -rotate-90">
      <circle cx="24" cy="24" r="18" fill="none" stroke="var(--color-surface)" strokeWidth="6" />
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="none"
        stroke="var(--color-amber)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
}

export function ReviewStep({
  evidenceFiles,
  aiResult,
  hazardType,
  severity,
  title,
  description,
  location,
  onEditStep,
}: ReviewStepProps) {
  const score = scoreFromAi(aiResult);
  const selectedSeverity = severity ? SEVERITY_OPTIONS.find((option) => option.value === severity) : null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={itemVariants} className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-neu)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Review & Submit</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Double-check your evidence, hazard details, and location before sending.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-success)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)] px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
            <CheckCircle2 size={14} />
            Ready to submit
          </span>
        </div>
      </motion.div>

      <motion.section variants={itemVariants} className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            <FileImage size={14} />
            Evidence
          </div>
          <button type="button" onClick={() => onEditStep(1)} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-amber)]">
            <Edit3 size={12} />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {evidenceFiles.map((file) => (
            <div key={file.id} className="aspect-square overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              {file.previewUrl ? (
                <img src={file.previewUrl} alt={file.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
                  <FileImage size={16} />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            <Sparkles size={14} />
            AI Analysis
          </div>
          <button type="button" onClick={() => onEditStep(2)} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-amber)]">
            <Edit3 size={12} />
            Edit
          </button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <MiniGauge score={score} />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{score}% risk signal</p>
              <p className="text-xs text-[var(--color-text-muted)]">{aiResult?.message ?? "AI suggestions were captured from your evidence."}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-amber)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-amber)_8%,transparent)] px-4 py-3 text-sm text-[var(--color-text-primary)] sm:ml-auto">
            Suggested category: <span className="font-semibold text-[var(--color-amber)]">{aiResult?.suggestedCategory ? HAZARD_LABEL_BY_VALUE[aiResult.suggestedCategory] : "Manual review"}</span>
          </div>
        </div>
        {aiResult?.annotatedImage?.url && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="relative aspect-video max-h-72 w-full flex justify-center bg-black/5">
              <img
                src={aiResult.annotatedImage.url}
                alt="AI Annotated Detection"
                className="h-full w-full object-contain"
              />
              <div className="absolute bottom-2 left-2 rounded-lg bg-black/50 px-2 py-1 text-[10px] text-white backdrop-blur-sm flex items-center gap-1">
                <Sparkles size={10} className="text-[var(--color-amber)] animate-pulse" />
                AI Annotated Result
              </div>
            </div>
          </div>
        )}
      </motion.section>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.section variants={itemVariants} className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Hazard Details
            </div>
            <button type="button" onClick={() => onEditStep(3)} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-amber)]">
              <Edit3 size={12} />
              Edit
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Hazard type</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{hazardType ? HAZARD_LABEL_BY_VALUE[hazardType] : "—"}</p>
              {hazardType && <p className="text-xs text-[var(--color-text-muted)]">Backend category: {BACKEND_CATEGORY_BY_HAZARD[hazardType]}</p>}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Severity</p>
              {selectedSeverity ? (
                <span className="mt-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold" style={{ borderColor: severityColor[selectedSeverity.value], color: severityColor[selectedSeverity.value] }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: severityColor[selectedSeverity.value] }} />
                  {selectedSeverity.label}
                </span>
              ) : (
                <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">—</p>
              )}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Title</p>
              <p className="mt-1 text-sm text-[var(--color-text-primary)]">{title || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Description</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{description || "—"}</p>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              <MapPin size={14} />
              Location
            </div>
            <button type="button" onClick={() => onEditStep(4)} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-amber)]">
              <Edit3 size={12} />
              Edit
            </button>
          </div>
          <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex h-44 items-center justify-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-amber)_12%,var(--color-surface))_0%,var(--color-surface)_100%)]">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-[var(--color-amber)] shadow-sm">
                  <MapPin size={28} />
                </div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{location.address || "Map pin selected"}</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{location.latitude != null && location.longitude != null ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : "Coordinates will appear here"}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
            <p>
              <span className="font-semibold text-[var(--color-text-primary)]">Landmark:</span> {location.landmark || "—"}
            </p>
            <p>
              <span className="font-semibold text-[var(--color-text-primary)]">Source:</span> {location.locationMode.toUpperCase()}
            </p>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
