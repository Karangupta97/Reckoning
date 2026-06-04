"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Droplets,
  TreePine,
  Construction,
  TrafficCone,
  CircleHelp,
} from "lucide-react";
import { useReportStore, type HazardType, type SeverityLevel } from "@/store/reportStore";

const HAZARD_TYPES: Array<{
  value: HazardType;
  label: string;
  icon: React.ElementType;
  color: string;
}> = [
  { value: "pothole", label: "Pothole", icon: AlertTriangle, color: "var(--color-amber)" },
  { value: "flooding", label: "Flooding", icon: Droplets, color: "var(--color-info)" },
  { value: "fallenTree", label: "Fallen Tree", icon: TreePine, color: "var(--color-success)" },
  { value: "roadDebris", label: "Road Debris", icon: Construction, color: "var(--color-amber)" },
  { value: "brokenSignal", label: "Broken Signal", icon: TrafficCone, color: "var(--color-danger)" },
  { value: "other", label: "Other", icon: CircleHelp, color: "var(--color-text-muted)" },
];

const SEVERITY_LEVELS: Array<{
  value: SeverityLevel;
  label: string;
  description: string;
  color: string;
}> = [
  { value: "low", label: "Low", description: "Minor inconvenience", color: "var(--color-success)" },
  { value: "medium", label: "Medium", description: "Moderate risk", color: "var(--color-amber)" },
  { value: "high", label: "High", description: "Significant danger", color: "var(--color-danger)" },
  { value: "critical", label: "Critical", description: "Immediate threat", color: "#dc2626" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function HazardInfoStep() {
  const { formData, updateForm } = useReportStore();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Hazard Type */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Hazard Type <span className="text-[var(--color-danger)]">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {HAZARD_TYPES.map(({ value, label, icon: Icon, color }) => {
            const isSelected = formData.hazardType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => updateForm({ hazardType: value })}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-[var(--color-amber)] bg-[color-mix(in_srgb,var(--color-amber)_8%,transparent)] shadow-[var(--shadow-neu)]"
                    : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
                }`}
                aria-pressed={isSelected}
              >
                <Icon
                  size={24}
                  style={{ color: isSelected ? color : "var(--color-text-muted)" }}
                  strokeWidth={1.8}
                />
                <span
                  className={`text-xs font-medium text-center ${
                    isSelected
                      ? "text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {label}
                </span>
                {isSelected && (
                  <motion.div
                    layoutId="hazard-selected"
                    className="absolute inset-0 rounded-xl border-2 border-[var(--color-amber)]"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Severity Level */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Severity Level <span className="text-[var(--color-danger)]">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SEVERITY_LEVELS.map(({ value, label, description, color }) => {
            const isSelected = formData.severity === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => updateForm({ severity: value })}
                className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? "border-[var(--color-amber)] bg-[color-mix(in_srgb,var(--color-amber)_8%,transparent)] shadow-[var(--shadow-neu)]"
                    : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      isSelected
                        ? "text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {description}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Title */}
      <motion.div variants={itemVariants}>
        <label
          htmlFor="hazard-title"
          className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2"
        >
          Hazard Title <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          id="hazard-title"
          type="text"
          value={formData.title}
          onChange={(e) => updateForm({ title: e.target.value })}
          placeholder="e.g., Large pothole on Highway 4 near Panvel"
          maxLength={120}
          className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)] focus:border-transparent transition-shadow"
        />
        <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block text-right">
          {formData.title.length}/120
        </span>
      </motion.div>

      {/* Description */}
      <motion.div variants={itemVariants}>
        <label
          htmlFor="hazard-description"
          className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2"
        >
          Description <span className="text-[var(--color-danger)]">*</span>
        </label>
        <textarea
          id="hazard-description"
          value={formData.description}
          onChange={(e) => updateForm({ description: e.target.value })}
          placeholder="Describe the hazard in detail — size, condition, potential risk to commuters..."
          rows={4}
          maxLength={500}
          className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)] focus:border-transparent transition-shadow resize-none"
        />
        <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block text-right">
          {formData.description.length}/500
        </span>
      </motion.div>
    </motion.div>
  );
}
