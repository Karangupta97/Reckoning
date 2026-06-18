"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  MoreHorizontal,
  CircleDot,
  Droplets,
  AlertTriangle,
  TrafficCone,
  TreePine,
  ChevronDown,
  Eye,
  ThumbsUp,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Check,
  Send,
  CheckCheck,
  ClipboardList,
  Wrench,
} from "lucide-react";
import type { MyReport } from "./types";
import { ReportTimeline } from "./ReportTimeline";
import { OfficialResponseCard } from "./OfficialResponseCard";
import { EvidenceGallery } from "./EvidenceGallery";
import { AIAnnotatedPanel } from "./AIAnnotatedPanel";
import { ReportLightbox } from "./ReportLightbox";

/* ─── Constants ───────────────────────────────────────────────── */
const HAZARD_ICONS: Record<string, React.ReactNode> = {
  pothole: <CircleDot size={13} />,
  flooding: <Droplets size={13} />,
  accident: <AlertTriangle size={13} />,
  signal: <TrafficCone size={13} />,
  debris: <TreePine size={13} />,
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "var(--color-danger)",
  high: "#F97316",
  medium: "var(--color-amber)",
  low: "var(--color-success)",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  submitted: {
    label: "Submitted",
    color: "var(--color-text-muted)",
    bg: "color-mix(in srgb, var(--color-text-muted) 12%, transparent)",
  },
  verified: {
    label: "Verified",
    color: "var(--color-info)",
    bg: "color-mix(in srgb, var(--color-info) 12%, transparent)",
  },
  assigned: {
    label: "Assigned",
    color: "var(--color-amber)",
    bg: "color-mix(in srgb, var(--color-amber) 12%, transparent)",
  },
  in_progress: {
    label: "In Progress",
    color: "var(--color-info)",
    bg: "color-mix(in srgb, var(--color-info) 12%, transparent)",
  },
  resolved: {
    label: "Resolved",
    color: "var(--color-success)",
    bg: "color-mix(in srgb, var(--color-success) 12%, transparent)",
  },
  rejected: {
    label: "Rejected",
    color: "var(--color-danger)",
    bg: "color-mix(in srgb, var(--color-danger) 12%, transparent)",
  },
};

const PROGRESS_STEPS = [
  { key: "submitted", label: "Submitted", icon: <Send size={10} /> },
  { key: "assigned", label: "Assigned", icon: <ClipboardList size={10} /> },
  { key: "in_progress", label: "In Progress", icon: <Wrench size={10} /> },
  { key: "resolved", label: "Resolved", icon: <CheckCircle2 size={10} /> },
];

const STATUS_STEP_INDEX: Record<string, number> = {
  submitted: 0,
  verified: 0,
  assigned: 1,
  in_progress: 2,
  resolved: 3,
  rejected: -1,
};

/* ─── Helpers ─────────────────────────────────────────────────── */
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function formatViews(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/* ─── Risk Score Mini Gauge ───────────────────────────────────── */
function RiskGauge({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[0.6rem] tabular-nums"
        style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
      >
        Risk
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--color-border)", minWidth: 48 }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, var(--color-amber) 0%, var(--color-danger) 100%)`,
          }}
        />
      </div>
      <span
        className="text-[0.6rem] tabular-nums"
        style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
      >
        {score}
      </span>
    </div>
  );
}

/* ─── Progress Track ──────────────────────────────────────────── */
function ProgressTrack({ report }: { report: MyReport }) {
  const isRejected = report.status === "rejected";
  const currentStep = STATUS_STEP_INDEX[report.status] ?? 0;

  if (isRejected) {
    return (
      <div className="flex items-center gap-2 pt-2">
        <div
          className="w-3 h-3 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--color-amber)" }}
        />
        <div
          className="flex-1 h-px"
          style={{
            background:
              "repeating-linear-gradient(90deg, var(--color-danger) 0, var(--color-danger) 4px, transparent 4px, transparent 8px)",
          }}
        />
        <div
          className="w-3 h-3 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--color-danger)" }}
        >
          <XCircle size={8} className="text-white" />
        </div>
        <span
          className="text-[0.6rem] ml-1"
          style={{ color: "var(--color-danger)" }}
        >
          Rejected
        </span>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <div className="flex items-center">
        {PROGRESS_STEPS.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          const isPending = i > currentStep;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-initial">
              {/* Dot */}
              <div className="relative flex-shrink-0">
                {isCurrent ? (
                  <motion.div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: "var(--color-amber)" }}
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {/* Pulse ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        border: "2px solid var(--color-amber)",
                      }}
                      animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>
                ) : (
                  <div
                    className="w-3 h-3 rounded-full border-2 flex items-center justify-center"
                    style={{
                      backgroundColor: isCompleted ? "var(--color-amber)" : "transparent",
                      borderColor: isCompleted
                        ? "var(--color-amber)"
                        : "var(--color-border)",
                    }}
                  >
                    {isCompleted && <Check size={7} className="text-white" />}
                  </div>
                )}
              </div>

              {/* Connector */}
              {i < PROGRESS_STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-1"
                  style={{
                    backgroundColor: isCompleted ? "var(--color-amber)" : "transparent",
                    backgroundImage: !isCompleted
                      ? "repeating-linear-gradient(90deg, var(--color-border) 0, var(--color-border) 4px, transparent 4px, transparent 8px)"
                      : undefined,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex mt-1.5">
        {PROGRESS_STEPS.map((step, i) => (
          <span
            key={step.key}
            className="flex-1 last:flex-initial text-[0.55rem] text-center first:text-left last:text-right truncate"
            style={{ color: "var(--color-text-muted)" }}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Action Menu ─────────────────────────────────────────────── */
function ActionMenu({
  report,
  onView,
  onEdit,
  onDelete,
}: {
  report: MyReport;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
        style={{ color: "var(--color-text-muted)" }}
        aria-label="Actions"
      >
        <MoreHorizontal size={15} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-50 rounded-xl border p-1.5 min-w-[120px]"
              style={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
                boxShadow: "var(--shadow-neu-lg)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  onView();
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--color-surface)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <Eye size={12} />
                View
              </button>
              {report.status === "submitted" && onEdit && (
                <button
                  onClick={() => {
                    onEdit();
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2"
                  style={{ color: "var(--color-text-secondary)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--color-surface)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  Edit
                </button>
              )}
              {report.status === "submitted" && onDelete && (
                <button
                  onClick={() => {
                    onDelete();
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2"
                  style={{ color: "var(--color-danger)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "color-mix(in srgb, var(--color-danger) 8%, transparent)";
                  }}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  Delete
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Expanded Detail (accordion) ─────────────────────────────── */
function ExpandedDetail({ report }: { report: MyReport }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const evidenceImages = report.evidenceUrls.length > 0
    ? report.evidenceUrls
    : report.hasPhoto && report.photoUrl
      ? Array.from({ length: report.photoCount }, (_, i) => `${report.photoUrl}&w=${800 + i * 50}`)
      : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-t pt-4 mt-3 space-y-4"
      style={{ borderColor: "var(--color-border)" }}
    >
      {/* Full description */}
      <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        {report.description}
      </p>

      {/* Evidence thumbnails — horizontal scrollable row */}
      {evidenceImages.length > 0 && (
        <div>
          <p
            className="text-[0.7rem] font-semibold mb-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            Evidence
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {evidenceImages.map((url, i) => (
              <button
                key={i}
                onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                className="flex-shrink-0 w-[120px] h-[90px] rounded-lg overflow-hidden group"
              >
                <img
                  src={url}
                  alt={`Evidence ${i + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Annotated Evidence */}
      <AIAnnotatedPanel report={report} />

      {/* Official response */}
      {report.officialResponse && (
        <OfficialResponseCard response={report.officialResponse} />
      )}

      {/* Stats row */}
      <div
        className="flex items-center gap-4 text-[0.7rem]"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span className="flex items-center gap-1">
          <ThumbsUp size={11} />
          <span style={{ fontFamily: "var(--font-mono)" }}>{report.upvotes}</span>
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle size={11} />
          <span style={{ fontFamily: "var(--font-mono)" }}>{report.comments}</span>
        </span>
        <span className="flex items-center gap-1">
          <Eye size={11} />
          <span style={{ fontFamily: "var(--font-mono)" }}>{formatViews(report.views)}</span>
        </span>
      </div>

      {/* Full timeline */}
      <div>
        <p
          className="text-[0.7rem] font-semibold mb-3"
          style={{ color: "var(--color-text-primary)" }}
        >
          Full Timeline
        </p>
        <ReportTimeline timeline={report.timeline} />
      </div>

      {/* Lightbox */}
      <ReportLightbox
        images={evidenceImages}
        annotatedImageUrl={report.annotatedImageUrl}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </motion.div>
  );
}

/* ─── ReportCard Component ─────────────────────────────────────── */
interface ReportCardProps {
  report: MyReport;
  onView: (report: MyReport) => void;
  onDelete?: (report: MyReport) => void;
}

export function ReportCard({ report, onView, onDelete }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.submitted;
  const severityColor = SEVERITY_COLORS[report.severity] ?? "var(--color-amber)";
  const hazardIcon = HAZARD_ICONS[report.hazardType];

  // Left border color by status
  const borderAccent = statusCfg.color;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="neu-card-lg overflow-hidden cursor-pointer transition-all duration-200"
      style={{ borderLeft: `3px solid ${borderAccent}` }}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="p-4">
        {/* Main row */}
        <div className="flex gap-3">
          {/* Thumbnail */}
          <div
            className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {report.hasPhoto && report.photoUrl ? (
              <img
                src={report.photoUrl}
                alt={report.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  backgroundColor: `color-mix(in srgb, ${severityColor} 12%, var(--color-surface))`,
                }}
              >
                <span
                  className="scale-150"
                  style={{ color: severityColor }}
                >
                  {hazardIcon ?? <CircleDot size={28} />}
                </span>
              </div>
            )}
          </div>

          {/* Center content */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-sm font-bold leading-snug line-clamp-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              {report.title}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={10} style={{ color: "var(--color-text-muted)" }} />
              <span
                className="text-[0.7rem] truncate"
                style={{ color: "var(--color-text-muted)" }}
              >
                {report.location.name}
              </span>
            </div>

            {/* Description truncated */}
            <p
              className="text-[0.7rem] leading-snug mt-1 line-clamp-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {report.description}
            </p>

            {/* Tags */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {/* Hazard type chip */}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.6rem] font-medium"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {hazardIcon}
                {report.hazardType.charAt(0).toUpperCase() + report.hazardType.slice(1)}
              </span>

              {/* Severity chip */}
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.6rem] font-semibold capitalize"
                style={{
                  backgroundColor: `color-mix(in srgb, ${severityColor} 12%, transparent)`,
                  color: severityColor,
                }}
              >
                {report.severity}
              </span>
            </div>
          </div>

          {/* Right column */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            {/* Status badge */}
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.6rem] font-bold"
              style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
            >
              {statusCfg.label}
            </span>

            {/* Report ID */}
            <span
              className="text-[0.6rem] tabular-nums"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-muted)",
              }}
            >
              {report.reportId}
            </span>

            {/* Date */}
            <div className="flex items-center gap-1">
              <Clock size={9} style={{ color: "var(--color-text-muted)" }} />
              <span
                className="text-[0.6rem]"
                style={{ color: "var(--color-text-muted)" }}
              >
                {formatTimeAgo(report.createdAt)}
              </span>
            </div>

            {/* Risk gauge */}
            <div className="w-28">
              <RiskGauge score={report.riskScore} />
            </div>

            {/* Action menu */}
            <div onClick={(e) => e.stopPropagation()}>
              <ActionMenu
                report={report}
                onView={() => onView(report)}
                onDelete={onDelete ? () => onDelete(report) : undefined}
              />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="flex items-center justify-between mt-3 pt-2.5 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div
            className="flex items-center gap-3 text-[0.7rem]"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span className="flex items-center gap-1">
              <ThumbsUp size={11} /> {report.upvotes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={11} /> {report.comments}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={11} /> {formatViews(report.views)}
            </span>
          </div>

          {/* Expand toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="flex items-center gap-1 text-[0.65rem] transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span>{expanded ? "Less" : "Details"}</span>
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={12} />
            </motion.span>
          </button>
        </div>

        {/* Progress Track */}
        <ProgressTrack report={report} />

        {/* Expanded accordion */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ overflow: "hidden" }}
              onClick={(e) => e.stopPropagation()}
            >
              <ExpandedDetail report={report} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
