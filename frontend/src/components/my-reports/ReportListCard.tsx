"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import {
  MapPin,
  ThumbsUp,
  MessageCircle,
  Eye,
  Clock,
  ChevronRight,
  Share2,
  Trash2,
  Check,
  CircleDot,
  Droplets,
  AlertTriangle,
  TrafficCone,
  TreePine,
} from "lucide-react";
import type { MyReport } from "./types";

/* ─── Hazard Icons ────────────────────────────────────────────── */
const HAZARD_ICONS: Record<string, React.ReactNode> = {
  pothole: <CircleDot size={12} />,
  flooding: <Droplets size={12} />,
  accident: <AlertTriangle size={12} />,
  signal: <TrafficCone size={12} />,
  debris: <TreePine size={12} />,
};

/* ─── Status Step Styles ──────────────────────────────────────── */
const SEVERITY_COLORS: Record<string, string> = {
  critical: "var(--color-danger)",
  high: "#F97316",
  medium: "var(--color-amber)",
  low: "var(--color-success)",
};

const STATUS_LABELS = ["Submitted", "Verified", "Assigned", "In Progress", "Resolved"];

/* ─── Props ───────────────────────────────────────────────────── */
interface ReportListCardProps {
  report: MyReport;
  onSelect: (report: MyReport) => void;
  onShare?: (report: MyReport) => void;
  onDelete?: (report: MyReport) => void;
}

/* ─── Format helpers ──────────────────────────────────────────── */
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

/* ─── Copy toast ──────────────────────────────────────────────── */
function useCopyToast() {
  const [show, setShow] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setShow(true);
    setTimeout(() => setShow(false), 1500);
  };
  return { show, copy };
}

/* ─── Component ───────────────────────────────────────────────── */
export function ReportListCard({ report, onSelect, onShare, onDelete }: ReportListCardProps) {
  const { show: toastVisible, copy } = useCopyToast();
  const x = useMotionValue(0);
  const actionsOpacity = useTransform(x, [-100, -50], [1, 0]);
  const actionsX = useTransform(x, [-100, 0], [0, 100]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80) {
      // keep swiped
    }
  };

  const totalSteps = report.status === "rejected" ? 2 : 5;
  const completedSteps = report.status === "rejected" ? 2 : report.statusStep;

  return (
    <div className="relative overflow-hidden rounded-2xl mb-3">
      {/* Swipe actions (mobile) */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-2 lg:hidden"
        style={{ opacity: actionsOpacity, x: actionsX }}
      >
        <button
          onClick={() => onShare?.(report)}
          className="w-12 h-12 rounded-xl bg-[var(--color-amber)] text-white flex items-center justify-center"
          aria-label="Share"
        >
          <Share2 size={18} />
        </button>
        {report.status === "submitted" && (
          <button
            onClick={() => onDelete?.(report)}
            className="w-12 h-12 rounded-xl bg-[var(--color-danger)] text-white flex items-center justify-center"
            aria-label="Delete"
          >
            <Trash2 size={18} />
          </button>
        )}
      </motion.div>

      {/* Main Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect(report)}
        className="relative bg-[var(--color-card)] border border-[var(--color-border)]/50 rounded-2xl shadow-[var(--shadow-neu)] p-4 cursor-pointer hover:border-[var(--color-amber)]/30 transition-colors"
      >
        {/* Copy toast */}
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-2 z-10 px-2 py-1 rounded-lg bg-[var(--color-success)] text-white text-[0.6rem] font-medium"
          >
            Copied!
          </motion.div>
        )}

        <div className="flex gap-3">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden">
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
                style={{ backgroundColor: `color-mix(in srgb, ${SEVERITY_COLORS[report.severity]} 15%, var(--color-surface))` }}
              >
                <span className="text-[var(--color-text-muted)]">
                  {HAZARD_ICONS[report.hazardType] ? (
                    <span className="[&_svg]:w-8 [&_svg]:h-8">{HAZARD_ICONS[report.hazardType]}</span>
                  ) : (
                    <CircleDot size={32} />
                  )}
                </span>
              </div>
            )}
            {/* Resolved overlay */}
            {report.status === "resolved" && (
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--color-success)] flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
            )}
            {/* Critical pulse */}
            {report.severity === "critical" && report.status !== "resolved" && (
              <motion.div
                className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[var(--color-danger)]"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-tight">
              {report.title}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 text-[0.7rem] text-[var(--color-text-muted)]">
              <MapPin size={10} />
              <span>{report.location.name}</span>
              <span>·</span>
              <span>{formatTimeAgo(report.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.65rem] font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
                {HAZARD_ICONS[report.hazardType]}
                {report.hazardType.charAt(0).toUpperCase() + report.hazardType.slice(1)}
              </span>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.65rem] font-medium capitalize"
                style={{
                  backgroundColor: `color-mix(in srgb, ${SEVERITY_COLORS[report.severity]} 12%, transparent)`,
                  color: SEVERITY_COLORS[report.severity],
                }}
              >
                {report.severity}
              </span>
            </div>

            {/* Report ID */}
            <button
              onClick={(e) => { e.stopPropagation(); copy(report.reportId); }}
              className="mt-1.5 text-[0.65rem] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-amber)] transition-colors"
              title="Copy report ID"
            >
              {report.reportId}
            </button>
          </div>

          {/* Chevron */}
          <div className="flex items-center text-[var(--color-text-muted)]">
            <ChevronRight size={16} />
          </div>
        </div>

        {/* Status Progress Bar */}
        <div className="mt-3 pt-3 border-t border-[var(--color-border)]/50">
          <div className="flex items-center">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const isCompleted = i < completedSteps;
              const isCurrent = i === completedSteps - 1 && !report.timeline[i]?.completed === false;
              const isPending = i >= completedSteps;
              return (
                <div key={i} className="flex items-center flex-1 last:flex-initial">
                  {/* Dot */}
                  <div className="relative">
                    {isCurrent && report.status !== "resolved" && report.status !== "rejected" ? (
                      <motion.div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: "var(--color-amber)" }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    ) : (
                      <div
                        className="w-3 h-3 rounded-full border-2"
                        style={{
                          backgroundColor: isCompleted
                            ? report.status === "rejected" ? "var(--color-danger)" : "var(--color-amber)"
                            : "transparent",
                          borderColor: isCompleted
                            ? report.status === "rejected" ? "var(--color-danger)" : "var(--color-amber)"
                            : "var(--color-border)",
                        }}
                      />
                    )}
                  </div>
                  {/* Connector line */}
                  {i < totalSteps - 1 && (
                    <div
                      className="flex-1 h-0.5 mx-1"
                      style={{
                        backgroundColor: i < completedSteps - 1
                          ? report.status === "rejected" ? "var(--color-danger)" : "var(--color-amber)"
                          : "var(--color-border)",
                        ...(isPending ? { backgroundImage: "repeating-linear-gradient(90deg, var(--color-border) 0, var(--color-border) 4px, transparent 4px, transparent 8px)" } : {}),
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {/* Current step label (mobile) */}
          <p className="text-[0.6rem] text-[var(--color-text-muted)] mt-1.5 sm:hidden">
            {report.status === "rejected"
              ? "Rejected"
              : STATUS_LABELS[completedSteps - 1] || STATUS_LABELS[0]}
          </p>
          {/* All labels (desktop) */}
          <div className="hidden sm:flex mt-1.5">
            {(report.status === "rejected" ? ["Submitted", "Rejected"] : STATUS_LABELS).map((label, i) => (
              <span
                key={i}
                className="flex-1 last:flex-initial text-[0.55rem] text-[var(--color-text-muted)] text-center first:text-left last:text-right"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Stats Row */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--color-border)]/30">
          <div className="flex items-center gap-3 text-[0.7rem] text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1"><ThumbsUp size={11} /> {report.upvotes}</span>
            <span className="flex items-center gap-1"><MessageCircle size={11} /> {report.comments}</span>
            <span className="flex items-center gap-1"><Eye size={11} /> {formatViews(report.views)}</span>
          </div>
          {report.lastUpdatedBy && report.lastUpdatedBy !== "Rahul M." && (
            <p className="text-[0.65rem] text-[var(--color-info)] flex items-center gap-1">
              <Clock size={10} />
              {report.lastUpdatedBy} · {formatTimeAgo(report.lastUpdatedAt)}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
