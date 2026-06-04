"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Car, ShieldAlert, EyeOff } from "lucide-react";
import { useReportStore, type TrafficImpact, type SafetyRisk } from "@/store/reportStore";

const TRAFFIC_IMPACTS: Array<{ value: TrafficImpact; label: string; description: string }> = [
  { value: "none", label: "None", description: "No traffic disruption" },
  { value: "minor", label: "Minor", description: "Slight slowdown" },
  { value: "moderate", label: "Moderate", description: "Partial lane blockage" },
  { value: "severe", label: "Severe", description: "Road fully blocked" },
];

const SAFETY_RISKS: Array<{ value: SafetyRisk; label: string; color: string }> = [
  { value: "low", label: "Low Risk", color: "var(--color-success)" },
  { value: "medium", label: "Medium Risk", color: "var(--color-amber)" },
  { value: "high", label: "High Risk", color: "var(--color-danger)" },
  { value: "critical", label: "Critical Risk", color: "#dc2626" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function AdditionalDetailsStep() {
  const { formData, updateForm } = useReportStore();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Incident Date & Time */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Incident Date & Time
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="date"
              value={formData.incidentDate}
              onChange={(e) => updateForm({ incidentDate: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)] focus:border-transparent transition-shadow"
              aria-label="Incident date"
            />
          </div>
          <div className="relative">
            <Clock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="time"
              value={formData.incidentTime}
              onChange={(e) => updateForm({ incidentTime: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)] focus:border-transparent transition-shadow"
              aria-label="Incident time"
            />
          </div>
        </div>
      </motion.div>

      {/* Traffic Impact */}
      <motion.div variants={itemVariants}>
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          <Car size={16} strokeWidth={1.8} />
          Traffic Impact
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TRAFFIC_IMPACTS.map(({ value, label, description }) => {
            const isSelected = formData.trafficImpact === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => updateForm({ trafficImpact: value })}
                className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? "border-[var(--color-amber)] bg-[color-mix(in_srgb,var(--color-amber)_8%,transparent)] shadow-[var(--shadow-neu)]"
                    : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
                }`}
                aria-pressed={isSelected}
              >
                <span
                  className={`text-sm font-semibold ${
                    isSelected
                      ? "text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {label}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {description}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Public Safety Risk */}
      <motion.div variants={itemVariants}>
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          <ShieldAlert size={16} strokeWidth={1.8} />
          Public Safety Risk
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SAFETY_RISKS.map(({ value, label, color }) => {
            const isSelected = formData.safetyRisk === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => updateForm({ safetyRisk: value })}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-[var(--color-amber)] bg-[color-mix(in_srgb,var(--color-amber)_8%,transparent)] shadow-[var(--shadow-neu)]"
                    : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
                }`}
                aria-pressed={isSelected}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span
                  className={`text-xs font-medium ${
                    isSelected
                      ? "text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Anonymous Toggle */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--color-info)_12%,transparent)] flex items-center justify-center">
              <EyeOff size={18} className="text-[var(--color-info)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Anonymous Reporting
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Your identity will not be shared publicly
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={formData.isAnonymous}
            onClick={() => updateForm({ isAnonymous: !formData.isAnonymous })}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
              formData.isAnonymous
                ? "bg-[var(--color-amber)]"
                : "bg-[var(--color-border)]"
            }`}
          >
            <motion.div
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
              animate={{ left: formData.isAnonymous ? "calc(100% - 24px)" : "4px" }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
