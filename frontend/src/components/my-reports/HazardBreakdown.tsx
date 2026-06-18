"use client";

import { motion } from "framer-motion";
import { CircleDot, Droplets, AlertTriangle, TrafficCone, TreePine } from "lucide-react";
import type { HazardType } from "./types";

const HAZARD_CONFIG: Record<
  HazardType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  pothole: {
    label: "Pothole",
    icon: <CircleDot size={14} />,
    color: "var(--color-amber)",
  },
  flooding: {
    label: "Flooding",
    icon: <Droplets size={14} />,
    color: "var(--color-info)",
  },
  accident: {
    label: "Accident",
    icon: <AlertTriangle size={14} />,
    color: "var(--color-danger)",
  },
  debris: {
    label: "Debris",
    icon: <TreePine size={14} />,
    color: "var(--color-success)",
  },
  signal: {
    label: "Signal",
    icon: <TrafficCone size={14} />,
    color: "#F97316",
  },
};

interface HazardBreakdownProps {
  breakdown: Record<HazardType, number>;
  total: number;
}

export function HazardBreakdown({ breakdown, total }: HazardBreakdownProps) {
  const entries = (Object.entries(breakdown) as [HazardType, number][]).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="space-y-3">
      {entries.map(([key, count], i) => {
        const cfg = HAZARD_CONFIG[key];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span
                className="flex items-center gap-2 text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <span style={{ color: cfg.color }}>{cfg.icon}</span>
                {cfg.label}
              </span>
              <span
                className="text-xs tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-amber)",
                }}
              >
                {count}
              </span>
            </div>
            {/* Progress bar */}
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--color-border)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: cfg.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.07 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
