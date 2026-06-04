"use client";

import { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Save, Send, Loader2 } from "lucide-react";
import { useReportStore } from "@/store/reportStore";
import { StepIndicator } from "./StepIndicator";
import { HazardInfoStep } from "./HazardInfoStep";
import { LocationStep } from "./LocationStep";
import { EvidenceStep } from "./EvidenceStep";
import { AdditionalDetailsStep } from "./AdditionalDetailsStep";
import { ReviewStep } from "./ReviewStep";
import { SuccessScreen } from "./SuccessScreen";

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

function StepContent({ step }: { step: number }) {
  switch (step) {
    case 1:
      return <HazardInfoStep />;
    case 2:
      return <LocationStep />;
    case 3:
      return <EvidenceStep />;
    case 4:
      return <AdditionalDetailsStep />;
    case 5:
      return <ReviewStep />;
    default:
      return null;
  }
}

function getStepTitle(step: number): string {
  switch (step) {
    case 1:
      return "Hazard Information";
    case 2:
      return "Location Information";
    case 3:
      return "Evidence & Supporting Media";
    case 4:
      return "Additional Details";
    case 5:
      return "Review & Submit";
    default:
      return "";
  }
}

export function ReportHazardForm() {
  const {
    currentStep,
    formData,
    isSubmitting,
    isSubmitted,
    draftSaved,
    nextStep,
    prevStep,
    setSubmitting,
    setSubmitted,
    setDraftSaved,
  } = useReportStore();

  // Autosave draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSubmitted && currentStep < 5) {
        try {
          localStorage.setItem("report-draft", JSON.stringify(formData));
          setDraftSaved(true);
        } catch {
          // Storage full or unavailable
        }
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData, isSubmitted, currentStep, setDraftSaved]);

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 1:
        return (
          formData.hazardType !== "" &&
          formData.severity !== "" &&
          formData.title.trim().length >= 5 &&
          formData.description.trim().length >= 10
        );
      case 2:
        if (formData.locationMethod === "auto") {
          return formData.latitude !== null && formData.longitude !== null;
        }
        return formData.address.trim().length >= 5;
      case 3:
        return true; // Evidence is optional
      case 4:
        return true; // Additional details are optional
      case 5:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const handleSubmit = useCallback(() => {
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      localStorage.removeItem("report-draft");
    }, 2000);
  }, [setSubmitting, setSubmitted]);

  const handleSaveDraft = useCallback(() => {
    try {
      localStorage.setItem("report-draft", JSON.stringify(formData));
      setDraftSaved(true);
    } catch {
      // Storage full
    }
  }, [formData, setDraftSaved]);

  if (isSubmitted) {
    return (
      <div className="neu-card-lg p-6 sm:p-8">
        <SuccessScreen />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="neu-card p-4 sm:p-6">
        <StepIndicator />
      </div>

      {/* Form Content */}
      <div className="neu-card-lg p-5 sm:p-8">
        {/* Step Title */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {getStepTitle(currentStep)}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {currentStep === 1 && "Tell us about the road hazard you encountered."}
            {currentStep === 2 && "Help us pinpoint the exact location of the hazard."}
            {currentStep === 3 && "Attach photos or videos as supporting evidence."}
            {currentStep === 4 && "Provide any additional context about the incident."}
            {currentStep === 5 && "Verify all details before final submission."}
          </p>
        </div>

        {/* Step Content with Animation */}
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={currentStep}
            custom={1}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <StepContent step={currentStep} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation / Action Buttons */}
      <div className="neu-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Back + Draft saved indicator */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
            {draftSaved && (
              <span className="text-[11px] text-[var(--color-success)] font-medium">
                ✓ Draft saved
              </span>
            )}
          </div>

          {/* Right: Save Draft + Next/Submit */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
            >
              <Save size={15} />
              <span className="hidden sm:inline">Save Draft</span>
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  canProceed()
                    ? "btn-amber"
                    : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] cursor-not-allowed"
                }`}
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-amber font-semibold text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Submit Report
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Actions */}
      <div className="fixed bottom-16 left-0 right-0 sm:hidden z-30 px-4 pb-3 pt-2 bg-gradient-to-t from-[var(--color-page)] via-[var(--color-page)] to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm shadow-sm transition-all ${
                canProceed()
                  ? "btn-amber"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
              }`}
            >
              Next Step
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl btn-amber font-semibold text-sm shadow-sm disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Submit Report
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
