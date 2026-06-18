"use client";

import { motion } from "framer-motion";
import { IMPACT_STATS } from "../mockData";
import { Icon } from "../icons";

const IMPACT_COLORS = [
  "#3B82F6", // Reports Submitted
  "#22C55E", // Verified Reports
  "#F59E0B", // Resolved Issues
  "#8B5CF6", // Citizens Impacted
  "#06B6D4", // Authorities Notified
  "#F97316", // Hazards Removed
];

export function ImpactSection() {
  return (
    <div className="neu-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
          Your Impact
        </h3>
        <button className="text-xs text-[var(--color-info)] hover:underline font-medium">
          See details
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {IMPACT_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-amber)] transition-colors duration-200"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: `color-mix(in srgb, ${IMPACT_COLORS[i]} 12%, transparent)`,
                color: IMPACT_COLORS[i],
              }}
            >
              <Icon name={stat.icon} size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <span className="block text-base sm:text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
                {stat.value}
              </span>
              <span className="block text-[10px] sm:text-[11px] text-[var(--color-text-muted)] leading-tight">
                {stat.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
