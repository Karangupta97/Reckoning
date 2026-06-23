"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import {
  REPORT_STEP_LABELS,
  type ReportHazardType,
  type ReportSeverityLevel,
  type ReportFormState,
  type ReportLocationState,
  type ReportStep,
} from "./reportTypes";
import { useSidebarStore } from "@/store/sidebarStore";
import { StepIndicator } from "./StepIndicator";
import { EvidenceStep } from "./EvidenceStep";
import { AIAnalysisStep } from "./AIAnalysisStep";
import { HazardInfoStep } from "./HazardInfoStep";
import { LocationStep } from "./LocationStep";
import { ReviewStep } from "./ReviewStep";
import { SuccessScreen } from "./SuccessScreen";

const stepVariants = {
  enter: (direction: 1 | -1) => ({
    x: direction > 0 ? 36 : -36,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: 1 | -1) => ({
    x: direction > 0 ? -36 : 36,
    opacity: 0,
  }),
};

interface ReportHazardFormProps {
  state: ReportFormState;
  draftSavedAt: string | null;
  canProceed: boolean;
  onJumpToStep: (step: ReportStep) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSelectEvidence: (files: File[], source: "camera" | "gallery" | "drop") => void;
  onRemoveEvidence: (id: string) => void;
  onAnalyseEvidence: () => void;
  onHazardTypeChange: (value: ReportHazardType | "") => void;
  onSeverityChange: (value: ReportSeverityLevel | "") => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLocationChange: (patch: Partial<ReportLocationState>) => void;
  onSubmitReport: () => void;
  onDismissToast: () => void;
  onTrackReport: () => void;
}

function getStepSubtitle(step: ReportStep): string {
  switch (step) {
    case 1:
      return "Upload evidence from your device or capture it live.";
    case 2:
      return "We scan the first uploaded image and pre-fill the report.";
    case 3:
      return "Confirm the AI suggestion or override it manually.";
    case 4:
      return "Pin the exact location and verify the resolved address.";
    case 5:
      return "Review the summary and submit the report.";
    default:
      return "";
  }
}

export function ReportHazardForm({
  state,
  draftSavedAt,
  canProceed,
  onJumpToStep,
  onPrevStep,
  onNextStep,
  onSelectEvidence,
  onRemoveEvidence,
  onAnalyseEvidence,
  onHazardTypeChange,
  onSeverityChange,
  onTitleChange,
  onDescriptionChange,
  onLocationChange,
  onSubmitReport,
  onDismissToast,
  onTrackReport,
}: ReportHazardFormProps) {
  const { expanded } = useSidebarStore();
  const currentStep = state.currentStep;
  const subtitle = getStepSubtitle(currentStep);
  const firstEvidencePreview = state.evidence[0]?.previewUrl ?? null;
  const showSubmit = currentStep === 5;
  const showAnalyse = currentStep === 1;
  const sidebarOffsetClass = expanded ? "lg:left-[280px]" : "lg:left-[80px]";

  return (
    <div className="space-y-6 pb-28 sm:pb-24">
      <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-6 shadow-[var(--shadow-neu)]">
        <StepIndicator currentStep={currentStep} onJumpToStep={onJumpToStep} />
      </div>

      <div className="mx-auto w-full max-w-2xl rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-neu-lg)] sm:p-8">
        <div className="mb-6 space-y-1">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] sm:text-xl">
            {REPORT_STEP_LABELS[currentStep]}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] sm:text-sm">{subtitle}</p>
        </div>

        <AnimatePresence mode="wait" custom={state.transitionDirection}>
          <motion.div
            key={currentStep}
            custom={state.transitionDirection}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.24, ease: "easeInOut" }}
          >
            {currentStep === 1 && (
              <EvidenceStep
                touchDevice={state.touchDevice}
                evidenceFiles={state.evidence}
                analysisState={state.analysisState}
                analysisError={state.analysisError}
                onSelectFiles={onSelectEvidence}
                onRemoveFile={onRemoveEvidence}
                onAnalyse={onAnalyseEvidence}
              />
            )}

            {currentStep === 2 && (
              <AIAnalysisStep
                analysisState={state.analysisState}
                analysisStatusIndex={state.analysisStatusIndex}
                analysisError={state.analysisError}
                previewUrl={firstEvidencePreview}
                onContinueManually={onNextStep}
                onDismissError={onDismissToast}
              />
            )}

            {currentStep === 3 && (
              <HazardInfoStep
                hazardType={state.hazardType}
                severity={state.severity}
                title={state.title}
                description={state.description}
                aiResult={state.aiResult}
                fieldSuggestions={state.fieldSuggestions}
                onHazardTypeChange={onHazardTypeChange}
                onSeverityChange={onSeverityChange}
                onTitleChange={onTitleChange}
                onDescriptionChange={onDescriptionChange}
              />
            )}

            {currentStep === 4 && (
              <LocationStep
                location={state.location}
                evidenceFiles={state.evidence}
                onLocationChange={onLocationChange}
              />
            )}

            {currentStep === 5 && (
              <ReviewStep
                evidenceFiles={state.evidence}
                aiResult={state.aiResult}
                hazardType={state.hazardType}
                severity={state.severity}
                title={state.title}
                description={state.description}
                location={state.location}
                onEditStep={onJumpToStep as (step: 1 | 2 | 3 | 4) => void}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Mobile-only inline step navigation */}
        <div className="mt-8 flex w-full items-center gap-3 lg:hidden">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={onPrevStep}
              className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors active:scale-95"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}

          {showSubmit ? (
            <button
              type="button"
              onClick={onSubmitReport}
              disabled={state.isSubmitting}
              className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl btn-amber px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70 active:scale-95"
            >
              {state.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {state.isSubmitting ? "Submitting…" : "Submit report"}
            </button>
          ) : showAnalyse ? (
            null
          ) : (
            <button
              type="button"
              onClick={onNextStep}
              disabled={!canProceed}
              className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl btn-amber px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-[var(--color-surface)] disabled:text-[var(--color-text-muted)] active:scale-95"
            >
              Next
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      <div
        className={`hidden lg:block fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-page)_85%,transparent)] backdrop-blur-xl ${sidebarOffsetClass}`}
      >
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-0">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Draft saved</p>
            <p className="truncate text-xs text-[var(--color-text-secondary)]">
              {draftSavedAt ? new Date(draftSavedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Saving…"}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={onPrevStep}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)]"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            {showSubmit ? (
              <button
                type="button"
                onClick={onSubmitReport}
                disabled={state.isSubmitting}
                className="inline-flex h-11 items-center gap-2 rounded-2xl btn-amber px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
              >
                {state.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {state.isSubmitting ? "Submitting…" : "Submit report"}
              </button>
            ) : showAnalyse ? (
              <button
                type="button"
                onClick={onAnalyseEvidence}
                disabled={!canProceed}
                className="inline-flex h-11 items-center gap-2 rounded-2xl btn-amber px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-[var(--color-surface)] disabled:text-[var(--color-text-muted)]"
              >
                Analyse with AI →
              </button>
            ) : (
              <button
                type="button"
                onClick={onNextStep}
                disabled={!canProceed}
                className="inline-flex h-11 items-center gap-2 rounded-2xl btn-amber px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-[var(--color-surface)] disabled:text-[var(--color-text-muted)]"
              >
                Next
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {state.toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed right-4 top-4 z-50 max-w-sm rounded-2xl border border-[color-mix(in_srgb,var(--color-amber)_20%,transparent)] bg-[var(--color-card)] px-4 py-3 shadow-[var(--shadow-neu-lg)]"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[color-mix(in_srgb,var(--color-amber)_12%,transparent)] p-1.5 text-[var(--color-amber)]">
                <ChevronRight size={12} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Notice</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{state.toastMessage}</p>
              </div>
              <button type="button" onClick={onDismissToast} className="text-xs font-semibold text-[var(--color-text-muted)]">
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {state.isSubmitted && state.submittedReportId && state.submittedTicketNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,10,16,0.76)] px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-[color-mix(in_srgb,var(--color-success)_22%,transparent)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-neu-lg)] sm:p-8">
            <SuccessScreen
              reportId={state.submittedReportId}
              ticketNumber={state.submittedTicketNumber}
              onTrackReport={onTrackReport}
            />
          </div>
        </div>
      )}
    </div>
  );
}
