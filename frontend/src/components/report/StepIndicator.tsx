"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useReportStore, type ReportStep } from "@/store/reportStore";

const STEPS: Array<{ step: ReportStep; label: string; shortLabel: string }> = [
  { step: 1, label: "Hazard Info", shortLabel: "Info" },
  { step: 2, label: "Location", shortLabel: "Location" },
  { step: 3, label: "Evidence", shortLabel: "Evidence" },
  { step: 4, label: "Details", shortLabel: "Details" },
  { step: 5, label: "Review", shortLabel: "Review" },
];

export function StepIndicator() {
  const { currentStep, setStep } = useReportStore();

  return (
    <div className="w-full">
      {/* Desktop step indicator */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-[var(--color-border)]">
          <motion.div
            className="h-full bg-[var(--color-amber)]"
            initial={{ width: "0%" }}
            animate={{
              width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        {STEPS.map(({ step, label }) => {
          const isCompleted = currentStep > step;
          const isActive = currentStep === step;

          return (
            <button
              key={step}
              onClick={() => {
                if (isCompleted) setStep(step);
              }}
              disabled={!isCompleted && !isActive}
              className="relative flex flex-col items-center gap-2 z-10"
              aria-label={`Step ${step}: ${label}`}
              aria-current={isActive ? "step" : undefined}
            >
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                  isCompleted
                    ? "bg-[var(--color-amber)] border-[var(--color-amber)] text-white"
                    : isActive
                    ? "bg-[var(--color-card)] border-[var(--color-amber)] text-[var(--color-amber)] shadow-[var(--shadow-neu)]"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]"
                }`}
                whileHover={isCompleted ? { scale: 1.1 } : {}}
                whileTap={isCompleted ? { scale: 0.95 } : {}}
              >
                {isCompleted ? <Check size={18} strokeWidth={2.5} /> : step}
              </motion.div>
              <span
                className={`text-xs font-medium ${
                  isActive
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile step indicator */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            Step {currentStep} of {STEPS.length}
          </span>
          <span className="text-xs font-semibold text-[var(--color-text-primary)]">
            {STEPS[currentStep - 1].label}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[var(--color-surface)] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--color-amber)]"
            initial={{ width: "0%" }}
            animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
        {/* Mobile step dots */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {STEPS.map(({ step }) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-colors ${
                step === currentStep
                  ? "bg-[var(--color-amber)]"
                  : step < currentStep
                  ? "bg-[var(--color-amber)] opacity-50"
                  : "bg-[var(--color-border)]"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
