"use client";

import { motion } from "framer-motion";
import { ACHIEVEMENT_TIMELINE } from "../mockData";
import { Icon } from "../icons";
import type { AchievementTimelineItem } from "../types";

const TYPE_COLORS: Record<AchievementTimelineItem["type"], string> = {
  rank: "#F59E0B",
  badge: "#8B5CF6",
  points: "#3B82F6",
  report: "#22C55E",
  streak: "#F97316",
};

export function AchievementTimeline() {
  return (
    <div className="neu-card p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
          Recent Achievements
        </h3>
        <button className="text-xs text-[var(--color-info)] hover:underline font-medium">
          View all
        </button>
      </div>

      {/* Timeline */}
      <div className="relative space-y-0">
        {/* Vertical line */}
        <div className="absolute left-4 top-3 bottom-3 w-[1px] bg-[var(--color-border)]" />

        {ACHIEVEMENT_TIMELINE.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="relative flex gap-3 py-3 group"
          >
            {/* Dot */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border z-10"
              style={{
                borderColor: `color-mix(in srgb, ${TYPE_COLORS[item.type]} 40%, transparent)`,
                background: `color-mix(in srgb, ${TYPE_COLORS[item.type]} 12%, var(--color-card))`,
                color: TYPE_COLORS[item.type],
              }}
            >
              <Icon name={item.icon} size={14} strokeWidth={2.2} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
                  {item.title}
                </span>
                <span className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)] flex-shrink-0 whitespace-nowrap">
                  {item.timeAgo}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
