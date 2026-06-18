"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Send,
  CheckCheck,
  ClipboardList,
  Wrench,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { TimelineEntry } from "./types";

/* ─── Step Icons ──────────────────────────────────────────────── */
const STEP_ICONS: Record<string, ReactNode> = {
  submitted: <Send size={14} />,
  verified: <CheckCheck size={14} />,
  assigned: <ClipboardList size={14} />,
  in_progress: <Wrench size={14} />,
  resolved: <CheckCircle2 size={14} />,
  rejected: <XCircle size={14} />,
};

const STEP_COLORS: Record<string, string> = {
  submitted: "var(--color-text-muted)",
  verified: "var(--color-info)",
  assigned: "var(--color-amber)",
  in_progress: "var(--color-info)",
  resolved: "var(--color-success)",
  rejected: "var(--color-danger)",
};

const ACTOR_STYLES: Record<string, string> = {
  citizen: "bg-[var(--color-surface)] text-[var(--color-text-secondary)]",
  community: "bg-[color-mix(in_srgb,var(--color-info)_12%,transparent)] text-[var(--color-info)]",
  system: "bg-[var(--color-surface)] text-[var(--color-text-muted)]",
  authority: "bg-[color-mix(in_srgb,var(--color-amber)_12%,transparent)] text-[var(--color-amber)]",
};

/* ─── Format date ─────────────────────────────────────────────── */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Pending";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " · " + date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/* ─── ReportTimeline ──────────────────────────────────────────── */
export function ReportTimeline({ timeline }: { timeline: TimelineEntry[] }) {
  // Show in reverse chronological order (latest first)
  const sortedTimeline = [...timeline].reverse();

  return (
    <div className="relative">
      {sortedTimeline.map((entry, i) => {
        const isLast = i === sortedTimeline.length - 1;
        const color = STEP_COLORS[entry.step] || "var(--color-text-muted)";

        return (
          <motion.div
            key={`${entry.step}-${i}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="relative flex gap-3 pb-5 last:pb-0"
          >
            {/* Vertical line */}
            {!isLast && (
              <div
                className="absolute left-[7px] top-5 bottom-0 w-0.5"
                style={{
                  backgroundColor: entry.completed ? color : "var(--color-border)",
                  ...(entry.completed
                    ? {}
                    : {
                        backgroundImage: `repeating-linear-gradient(180deg, var(--color-border) 0, var(--color-border) 3px, transparent 3px, transparent 6px)`,
                        backgroundColor: "transparent",
                      }),
                }}
              />
            )}

            {/* Dot */}
            <div className="relative flex-shrink-0 mt-0.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center border-2"
                style={{
                  backgroundColor: entry.completed ? color : "transparent",
                  borderColor: color,
                }}
              >
                {entry.completed && (
                  <span className="text-white text-[0.45rem]">
                    {entry.step === "resolved" ? "✓" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ color }} className="flex-shrink-0">
                  {STEP_ICONS[entry.step] || <Send size={14} />}
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: entry.completed ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
                >
                  {entry.label}
                </span>
                <span className="text-[0.65rem] text-[var(--color-text-muted)]">
                  {formatDate(entry.date)}
                </span>
              </div>

              {entry.note && (
                <p
                  className="text-[0.7rem] mt-1 leading-relaxed"
                  style={{ color: entry.completed ? "var(--color-text-secondary)" : "var(--color-text-muted)" }}
                >
                  {entry.note}
                </p>
              )}

              {entry.actor && (
                <span
                  className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-[0.6rem] font-medium ${
                    ACTOR_STYLES[entry.actorType] || ACTOR_STYLES.system
                  }`}
                >
                  — {entry.actor}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
