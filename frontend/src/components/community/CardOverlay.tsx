"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { STATUS_STEPS, SEVERITY_COLORS, SEVERITY_LABELS } from "./mockData";
import type { ReportFeedItem } from "./types";

interface CardOverlayProps {
  report: ReportFeedItem;
  onFollow: () => void;
}

export function CardOverlay({ report, onFollow }: CardOverlayProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute left-0 right-16 bottom-0 px-4 pb-6 z-10 pointer-events-auto">
      {/* Row 1: Avatar + Username + Follow */}
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: report.userColor }}
        >
          {report.userInitial}
        </div>
        <span className="text-[0.9rem] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]" style={{ fontFamily: "var(--font-sans)" }}>
          {report.userName}
        </span>
        {report.isVerified && (
          <span className="text-[0.7rem] text-blue-400">✓</span>
        )}
        <span className="text-white/50 text-sm">·</span>
        {!report.isFollowing ? (
          <motion.button
            onClick={(e) => { e.stopPropagation(); onFollow(); }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1 rounded-full border border-white/60 text-[0.8rem] font-medium text-white hover:bg-white hover:text-[var(--color-text-primary)] transition-colors"
          >
            Follow
          </motion.button>
        ) : (
          <motion.button
            onClick={(e) => { e.stopPropagation(); onFollow(); }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1 rounded-full bg-white text-[0.8rem] font-medium text-[var(--color-text-primary)]"
          >
            Following
          </motion.button>
        )}
      </div>

      {/* Row 2: Location + time */}
      <div className="flex items-center gap-1 mb-1 text-[0.8rem] text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <MapPin size={12} className="shrink-0" />
        <span className="truncate">{report.location}</span>
        <span className="text-white/50">·</span>
        <span className="shrink-0">{report.timeAgo}</span>
      </div>

      {/* Row 3: Title */}
      <p className="text-[0.95rem] font-semibold text-white leading-snug line-clamp-2 mb-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]" style={{ fontFamily: "var(--font-sans)" }}>
        {report.title}
      </p>

      {/* Row 4: Description */}
      <p className="text-[0.8rem] text-white/70 leading-relaxed mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {expanded ? report.description : report.description.slice(0, 80)}
        {report.description.length > 80 && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="ml-1 text-white/50 font-medium"
          >
            {expanded ? "less" : "...more"}
          </button>
        )}
      </p>

      {/* Row 5: Tags */}
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.75rem] font-medium bg-white/10 text-white backdrop-blur-sm">
          {report.hazardEmoji} {report.hazardType.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.75rem] font-medium backdrop-blur-sm"
          style={{ backgroundColor: `${SEVERITY_COLORS[report.severity]}30`, color: SEVERITY_COLORS[report.severity] }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[report.severity] }} />
          {SEVERITY_LABELS[report.severity]}
        </span>
      </div>

      {/* Row 6: Status bar */}
      <StatusProgressBar currentStep={report.statusStep} />
    </div>
  );
}

function StatusProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((label, i) => {
        const step = i + 1;
        const isCompleted = step <= currentStep;
        const isCurrent = step === currentStep;

        return (
          <div key={label} className="flex items-center">
            {/* Dot */}
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: isCompleted ? "var(--color-amber)" : "transparent",
                border: isCompleted ? "none" : "1.5px solid rgba(255,255,255,0.4)",
              }}
            />
            {/* Connector line */}
            {i < STATUS_STEPS.length - 1 && (
              <div
                className="w-5 h-[1.5px] mx-0.5"
                style={{ backgroundColor: step < currentStep ? "var(--color-amber)" : "rgba(255,255,255,0.2)" }}
              />
            )}
          </div>
        );
      })}
      {/* Current step label */}
      <span className="ml-2 text-[0.75rem] text-white/80 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {STATUS_STEPS[currentStep - 1]}
      </span>
    </div>
  );
}
