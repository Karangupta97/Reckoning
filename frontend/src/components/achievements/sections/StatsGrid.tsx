"use client";

import { motion } from "framer-motion";
import { STATS } from "../mockData";
import { Icon } from "../icons";

const ICON_COLORS: Record<string, string> = {
  points: "#F59E0B",
  reputation: "#22C55E",
  streak: "#F97316",
  rank: "#3B82F6",
};

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {STATS.map((stat, i) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="neu-card p-4 sm:p-5 flex flex-col gap-2 group hover:scale-[1.02] transition-transform duration-200"
        >
          <div className="flex items-center justify-between">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `color-mix(in srgb, ${ICON_COLORS[stat.id] || "#F59E0B"} 12%, transparent)`,
                color: ICON_COLORS[stat.id] || "#F59E0B",
              }}
            >
              <Icon name={stat.icon} size={20} strokeWidth={2} />
            </div>
            <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)] font-medium">
              {stat.label}
            </span>
          </div>

          <div className="mt-1">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
              {stat.value}
            </span>
          </div>

          {stat.sublabel && (
            <span
              className="text-[11px] sm:text-xs font-medium"
              style={{ color: stat.sublabelColor || "var(--color-text-muted)" }}
            >
              {stat.sublabel}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
