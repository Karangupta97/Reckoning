"use client";

import { motion } from "framer-motion";
import { HelpCircle, ChevronRight, Zap } from "lucide-react";
import { RANKS, USER_PROFILE } from "../mockData";
import { Icon } from "../icons";

export function RankProgress() {
  const currentLevel = USER_PROFILE.currentRank.level;
  const currentXP = USER_PROFILE.totalXP;            // 2450
  const nextRankXP = USER_PROFILE.nextRankXP;        // 3000
  const currentRankMinXP = USER_PROFILE.currentRank.minPoints; // 1000

  // Progress % within the current rank band
  const bandSize = nextRankXP - currentRankMinXP;
  const bandProgress = currentXP - currentRankMinXP;
  const xpPct = Math.min(100, Math.round((bandProgress / bandSize) * 100));
  const xpToNext = nextRankXP - currentXP;

  // Progress % across all ranks (for the connecting track)
  const totalMax = RANKS[RANKS.length - 1].minPoints + 3000; // approx ceiling
  const trackPct = Math.min(100, (currentXP / totalMax) * 100);

  return (
    <div className="neu-card p-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: `color-mix(in srgb, ${USER_PROFILE.currentRank.color} 15%, transparent)`,
            }}
          >
            <Zap
              size={14}
              style={{ color: USER_PROFILE.currentRank.color }}
              strokeWidth={2.5}
            />
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Your Rank Progress
          </h3>
        </div>
        <button className="flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-info)] transition-colors">
          <HelpCircle size={12} />
          How it works
        </button>
      </div>

      {/* ── Current rank + XP bar ── */}
      <div className="mb-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `color-mix(in srgb, ${USER_PROFILE.currentRank.color} 18%, transparent)`,
                color: USER_PROFILE.currentRank.color,
                boxShadow: `0 0 12px color-mix(in srgb, ${USER_PROFILE.currentRank.color} 25%, transparent)`,
              }}
            >
              <Icon name={USER_PROFILE.currentRank.icon} size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-sm font-bold"
                  style={{ color: USER_PROFILE.currentRank.color }}
                >
                  {USER_PROFILE.currentRank.title}
                </span>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: `color-mix(in srgb, ${USER_PROFILE.currentRank.color} 15%, transparent)`,
                    color: USER_PROFILE.currentRank.color,
                  }}
                >
                  Lv.{currentLevel}
                </span>
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)]">
                {currentXP.toLocaleString()} XP earned
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
              {xpPct}%
            </span>
            <div className="text-[10px] text-[var(--color-text-muted)]">to next</div>
          </div>
        </div>

        {/* XP progress bar */}
        <div className="relative h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${USER_PROFILE.currentRank.color}, color-mix(in srgb, ${USER_PROFILE.currentRank.color} 70%, #fff))`,
              boxShadow: `0 0 8px color-mix(in srgb, ${USER_PROFILE.currentRank.color} 50%, transparent)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {currentRankMinXP.toLocaleString()} XP
          </span>
          <span className="text-[10px] font-medium" style={{ color: USER_PROFILE.currentRank.color }}>
            {xpToNext.toLocaleString()} XP to unlock next rank
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {nextRankXP.toLocaleString()} XP
          </span>
        </div>
      </div>

      {/* ── Rank track ── */}
      <div className="relative">
        {/* Background track */}
        <div className="absolute top-[18px] left-4 right-4 h-[2px] bg-[var(--color-border)] rounded-full z-0" />

        {/* Filled track */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((currentLevel - 1) / (RANKS.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="absolute top-[18px] left-4 h-[2px] rounded-full z-[1]"
          style={{
            background: `linear-gradient(90deg, #22C55E, ${USER_PROFILE.currentRank.color})`,
            maxWidth: "calc(100% - 2rem)",
          }}
        />

        {/* Rank nodes */}
        <div className="flex items-start justify-between relative z-10">
          {RANKS.map((rank, idx) => {
            const isActive = rank.level === currentLevel;
            const isCompleted = rank.level < currentLevel;
            const isFuture = rank.level > currentLevel;

            return (
              <div key={rank.level} className="flex flex-col items-center gap-1.5" style={{ flex: 1 }}>
                {/* Node */}
                <motion.div
                  initial={{ scale: 0.85 }}
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.07 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 shrink-0"
                  style={{
                    borderColor: isFuture ? "var(--color-border)" : rank.color,
                    background: isActive
                      ? `color-mix(in srgb, ${rank.color} 18%, transparent)`
                      : isCompleted
                      ? `color-mix(in srgb, ${rank.color} 10%, transparent)`
                      : "var(--color-surface)",
                    boxShadow: isActive
                      ? `0 0 14px color-mix(in srgb, ${rank.color} 40%, transparent), 0 0 0 2px color-mix(in srgb, ${rank.color} 20%, transparent)`
                      : "none",
                    color: isFuture ? "var(--color-text-muted)" : rank.color,
                    opacity: isFuture ? 0.45 : 1,
                  }}
                >
                  <Icon name={rank.icon} size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                </motion.div>

                {/* Title */}
                <span
                  className="text-[10px] font-semibold text-center leading-tight max-w-[60px]"
                  style={{
                    color: isActive
                      ? rank.color
                      : isFuture
                      ? "var(--color-text-muted)"
                      : "var(--color-text-secondary)",
                  }}
                >
                  {rank.title}
                </span>

                {/* Level badge */}
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isActive
                      ? `color-mix(in srgb, ${rank.color} 15%, transparent)`
                      : isCompleted
                      ? `color-mix(in srgb, ${rank.color} 10%, transparent)`
                      : "var(--color-surface)",
                    color: isFuture ? "var(--color-text-muted)" : rank.color,
                    border: isActive ? `1px solid color-mix(in srgb, ${rank.color} 30%, transparent)` : "1px solid transparent",
                  }}
                >
                  Lv.{rank.level}
                </span>

                {/* Points range */}
                <span className="text-[9px] text-[var(--color-text-muted)] text-center leading-tight">
                  {rank.minPoints >= 1000
                    ? `${rank.minPoints / 1000}K`
                    : rank.minPoints}
                  {rank.maxPoints
                    ? `–${rank.maxPoints >= 1000 ? `${rank.maxPoints / 1000}K` : rank.maxPoints}`
                    : "+"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Next rank teaser ── */}
      {currentLevel < RANKS.length && (
        <div
          className="mt-4 flex items-center justify-between rounded-xl px-3.5 py-2.5"
          style={{
            background: `color-mix(in srgb, ${RANKS[currentLevel].color} 8%, transparent)`,
            border: `1px solid color-mix(in srgb, ${RANKS[currentLevel].color} 20%, transparent)`,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{
                background: `color-mix(in srgb, ${RANKS[currentLevel].color} 15%, transparent)`,
                color: RANKS[currentLevel].color,
              }}
            >
              <Icon name={RANKS[currentLevel].icon} size={13} strokeWidth={2} />
            </div>
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)]">Next rank</span>
              <span
                className="ml-1.5 text-[10px] font-semibold"
                style={{ color: RANKS[currentLevel].color }}
              >
                {RANKS[currentLevel].title}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium text-[var(--color-text-muted)]">
              {xpToNext.toLocaleString()} XP needed
            </span>
            <ChevronRight size={12} className="text-[var(--color-text-muted)]" />
          </div>
        </div>
      )}
    </div>
  );
}
