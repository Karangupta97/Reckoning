"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { BADGES } from "../mockData";
import { Icon } from "../icons";
import type { Badge } from "../types";

const RARITY_COLORS: Record<Badge["rarity"], string> = {
  common: "#22C55E",
  rare: "#3B82F6",
  epic: "#8B5CF6",
  legendary: "#F59E0B",
};

export function BadgesCollection() {
  const unlockedCount = BADGES.filter((b) => b.unlocked).length;

  return (
    <div className="neu-card p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
          Badges Collection
        </h3>
        <span className="text-xs text-[var(--color-text-muted)]">
          {unlockedCount}/{BADGES.length} unlocked
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
        {BADGES.map((badge, i) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="group relative flex flex-col items-center text-center"
          >
            {/* Badge circle */}
            <div
              className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2"
              style={{
                borderColor: badge.unlocked ? RARITY_COLORS[badge.rarity] : "var(--color-border)",
                background: badge.unlocked
                  ? `color-mix(in srgb, ${RARITY_COLORS[badge.rarity]} 12%, transparent)`
                  : "var(--color-surface)",
                opacity: badge.unlocked ? 1 : 0.5,
                boxShadow: badge.unlocked
                  ? `0 0 12px color-mix(in srgb, ${RARITY_COLORS[badge.rarity]} 25%, transparent)`
                  : "none",
                color: badge.unlocked ? RARITY_COLORS[badge.rarity] : "var(--color-text-muted)",
              }}
            >
              <Icon name={badge.icon} size={22} strokeWidth={1.8} />

              {/* Lock overlay for locked badges */}
              {!badge.unlocked && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30">
                  <Lock size={14} className="text-white/70" strokeWidth={2.2} />
                </div>
              )}
            </div>

            {/* Badge name */}
            <span
              className="mt-2 text-[10px] sm:text-xs font-medium leading-tight"
              style={{
                color: badge.unlocked ? "var(--color-text-primary)" : "var(--color-text-muted)",
              }}
            >
              {badge.name}
            </span>

            {/* Progress or description */}
            <span className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-tight">
              {badge.unlocked ? badge.description : `${badge.progress}/${badge.total}`}
            </span>

            {/* Progress bar for locked badges */}
            {!badge.unlocked && badge.progress !== undefined && badge.total !== undefined && (
              <div className="w-full mt-1.5 h-1 rounded-full bg-[var(--color-surface)] overflow-hidden border border-[var(--color-border)]">
                <div
                  className="h-full rounded-full bg-[var(--color-text-muted)]"
                  style={{ width: `${(badge.progress / badge.total) * 100}%` }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
