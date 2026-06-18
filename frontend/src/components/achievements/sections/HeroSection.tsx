"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Building } from "lucide-react";
import { USER_PROFILE } from "../mockData";
import { Icon } from "../icons";

export function HeroSection() {
  const { name, citizenId, currentRank, totalXP, nextRankXP } = USER_PROFILE;
  const progressPercent = (totalXP / nextRankXP) * 100;
  const xpRemaining = nextRankXP - totalXP;

  // Find next rank
  const nextRankTitle = currentRank.level < 4 ? "Community Sentinel" : "Max Rank";

  return (
    <div className="neu-card-lg p-5 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top right, ${currentRank.color}, transparent 60%)`,
        }}
      />

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
        {/* Avatar + Name + Rank */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Avatar */}
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold border-2"
            style={{
              borderColor: currentRank.color,
              background: `color-mix(in srgb, ${currentRank.color} 12%, transparent)`,
              color: currentRank.color,
            }}
          >
            {name.charAt(0)}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                {name}
              </h2>
              <BadgeCheck size={16} className="text-[var(--color-success)]" strokeWidth={2.2} />
            </div>

            {/* Rank badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-1.5 w-fit"
              style={{
                background: `color-mix(in srgb, ${currentRank.color} 15%, transparent)`,
                color: currentRank.color,
                border: `1px solid color-mix(in srgb, ${currentRank.color} 30%, transparent)`,
              }}
            >
              <Icon name={currentRank.icon} size={14} strokeWidth={2.2} />
              <span>{currentRank.title}</span>
            </div>

            <span className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Rank Level {currentRank.level}
            </span>
          </div>
        </div>

        {/* XP & Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)]">
                  {totalXP.toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-[var(--color-amber)]">XP</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Total Points</p>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--color-text-muted)]">Next Rank</span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{
                    background: "color-mix(in srgb, var(--color-info) 12%, transparent)",
                    color: "var(--color-info)",
                  }}
                >
                  <Building size={11} strokeWidth={2.2} />
                  {nextRankTitle}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {xpRemaining} XP to go
              </p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="relative w-full h-3 sm:h-4 rounded-full overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number], delay: 0.3 }}
              className="h-full rounded-full relative"
              style={{
                background: `linear-gradient(90deg, ${currentRank.color}, var(--color-amber))`,
                boxShadow: `0 0 12px color-mix(in srgb, ${currentRank.color} 40%, transparent)`,
              }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>

          {/* Progress labels */}
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">
              {currentRank.minPoints.toLocaleString()} XP
            </span>
            <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">
              {nextRankXP.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
