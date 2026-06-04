"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  MapPin,
  FileImage,
  Clock,
  Shield,
  EyeOff,
  Check,
} from "lucide-react";
import { useReportStore } from "@/store/reportStore";

const HAZARD_LABELS: Record<string, string> = {
  pothole: "Pothole",
  flooding: "Flooding",
  fallenTree: "Fallen Tree",
  roadDebris: "Road Debris",
  brokenSignal: "Broken Signal",
  other: "Other",
};

const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "var(--color-success)" },
  medium: { label: "Medium", color: "var(--color-amber)" },
  high: { label: "High", color: "var(--color-danger)" },
  critical: { label: "Critical", color: "#dc2626" },
};

const TRAFFIC_LABELS: Record<string, string> = {
  none: "No Impact",
  minor: "Minor Disruption",
  moderate: "Moderate Disruption",
  severe: "Severe Blockage",
};

const SAFETY_LABELS: Record<string, string> = {
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
  critical: "Critical Risk",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function ReviewStep() {
  const { formData } = useReportStore();
  const severityInfo = SEVERITY_LABELS[formData.severity] || { label: "—", color: "var(--color-text-muted)" };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Summary Header */}
      <motion.div variants={itemVariants} className="text-center mb-2">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Review Your Report
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Please verify all details before submitting
        </p>
      </motion.div>

      {/* Hazard Info Card */}
      <motion.div
        variants={itemVariants}
        className="p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-3"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
          <AlertTriangle size={14} />
          Hazard Information
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)]">Type</span>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {HAZARD_LABELS[formData.hazardType] || "—"}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)]">Severity</span>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: severityInfo.color }}
              />
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {severityInfo.label}
              </p>
            </div>
          </div>
        </div>
        <div>
          <span className="text-[11px] text-[var(--color-text-muted)]">Title</span>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {formData.title || "—"}
          </p>
        </div>
        {formData.description && (
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)]">Description</span>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {formData.description}
            </p>
          </div>
        )}
      </motion.div>

      {/* Location Card */}
      <motion.div
        variants={itemVariants}
        className="p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-3"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
          <MapPin size={14} />
          Location
        </div>
        {formData.latitude && formData.longitude && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface)]">
            <span className="text-xs font-mono text-[var(--color-text-secondary)]">
              {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </span>
          </div>
        )}
        {formData.address && (
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)]">Address</span>
            <p className="text-sm text-[var(--color-text-primary)]">{formData.address}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {formData.road && (
            <div>
              <span className="text-[11px] text-[var(--color-text-muted)]">Road</span>
              <p className="text-sm text-[var(--color-text-primary)]">{formData.road}</p>
            </div>
          )}
          {formData.landmark && (
            <div>
              <span className="text-[11px] text-[var(--color-text-muted)]">Landmark</span>
              <p className="text-sm text-[var(--color-text-primary)]">{formData.landmark}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Evidence Card */}
      {formData.files.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            <FileImage size={14} />
            Evidence ({formData.files.length} file{formData.files.length > 1 ? "s" : ""})
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {formData.files.map((file) => (
              <div
                key={file.id}
                className="aspect-square rounded-lg overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)]"
              >
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileImage size={16} className="text-[var(--color-text-muted)]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Additional Details Card */}
      <motion.div
        variants={itemVariants}
        className="p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm space-y-3"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
          <Clock size={14} />
          Additional Details
        </div>
        <div className="grid grid-cols-2 gap-3">
          {formData.incidentDate && (
            <div>
              <span className="text-[11px] text-[var(--color-text-muted)]">Date</span>
              <p className="text-sm text-[var(--color-text-primary)]">{formData.incidentDate}</p>
            </div>
          )}
          {formData.incidentTime && (
            <div>
              <span className="text-[11px] text-[var(--color-text-muted)]">Time</span>
              <p className="text-sm text-[var(--color-text-primary)]">{formData.incidentTime}</p>
            </div>
          )}
          {formData.trafficImpact && (
            <div>
              <span className="text-[11px] text-[var(--color-text-muted)]">Traffic Impact</span>
              <p className="text-sm text-[var(--color-text-primary)]">
                {TRAFFIC_LABELS[formData.trafficImpact]}
              </p>
            </div>
          )}
          {formData.safetyRisk && (
            <div>
              <span className="text-[11px] text-[var(--color-text-muted)]">Safety Risk</span>
              <p className="text-sm text-[var(--color-text-primary)]">
                {SAFETY_LABELS[formData.safetyRisk]}
              </p>
            </div>
          )}
        </div>
        {formData.isAnonymous && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[color-mix(in_srgb,var(--color-info)_8%,transparent)]">
            <EyeOff size={14} className="text-[var(--color-info)]" />
            <span className="text-xs text-[var(--color-info)] font-medium">
              Submitting anonymously
            </span>
          </div>
        )}
      </motion.div>

      {/* Confirmation Note */}
      <motion.div
        variants={itemVariants}
        className="flex items-start gap-3 p-4 rounded-xl bg-[color-mix(in_srgb,var(--color-success)_6%,transparent)] border border-[color-mix(in_srgb,var(--color-success)_20%,transparent)]"
      >
        <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] flex items-center justify-center shrink-0">
          <Check size={16} className="text-[var(--color-success)]" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--color-success)]">
            Ready to submit
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Your report will be sent to the relevant authority for verification and action.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
