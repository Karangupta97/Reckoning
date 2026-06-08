"use client";

import { motion } from "framer-motion";
import { RANKS, USER_PROFILE } from "../mockData";
import { Icon } from "../icons";

export function RankProgress() {
  const currentLevel = USER_PROFILE.currentRank.level;

  return (
    <div className="neu-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
          Your Rank Progress
        </h3>
        <button className="text-xs text-[var(--color-info)] hover:underline font-medium">
          How it works?
        </button>
      </div>

      {/* Rank Ladder */}
      <div className="flex items-start justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-6 left-0 right-0 h-[2px] bg-[var(--color-border)] z-0" />
        <div
          className="absolute top-6 left-0 h-[2px] z-[1] transition-all duration-700"
          style={{
            width: `${((currentLevel - 1) / (RANKS.length - 1)) * 100}%`,
            background: `linear-gradient(90deg, var(--color-success), ${USER_PROFILE.currentRank.color})`,
            boxShadow: `0 0 8px color-mix(in srgb, ${USER_PROFILE.currentRank.color} 40%, transparent)`,
          }}
        />

        {RANKS.map((rank) => {
          const isActive = rank.level === currentLevel;
          const isCompleted = rank.level < currentLevel;
          const isFuture = rank.level > currentLevel;

          return (
            <div key={rank.level} className="flex flex-col items-center relative z-10 flex-1">
              {/* Circle indicator */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: isActive ? 1.15 : 1 }}
                transition={{ duration: 0.4 }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                style={{
                  borderColor: isFuture ? "var(--color-border)" : rank.color,
                  background: isActive
                    ? `color-mix(in srgb, ${rank.color} 20%, transparent)`
                    : isCompleted
                    ? `color-mix(in srgb, ${rank.color} 12%, transparent)`
                    : "var(--color-surface)",
                  boxShadow: isActive
                    ? `0 0 16px color-mix(in srgb, ${rank.color} 35%, transparent)`
                    : "none",
                  opacity: isFuture ? 0.5 : 1,
                  color: isFuture ? "var(--color-text-muted)" : rank.color,
                }}
              >
                <Icon name={rank.icon} size={20} strokeWidth={2} />
              </motion.div>

              {/* Label */}
              <span
                className="mt-2 text-[10px] sm:text-xs font-semibold text-center leading-tight"
                style={{
                  color: isActive ? rank.color : isFuture ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                }}
              >
                {rank.title}
              </span>

              {/* Points range */}
              <span className="mt-0.5 text-[9px] sm:text-[10px] text-[var(--color-text-muted)] text-center">
                {rank.minPoints.toLocaleString()}
                {rank.maxPoints ? ` – ${rank.maxPoints.toLocaleString()}` : "+"}
              </span>

              {/* Level number */}
              <span
                className="mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: isActive
                    ? `color-mix(in srgb, ${rank.color} 15%, transparent)`
                    : "transparent",
                  color: isActive ? rank.color : "var(--color-text-muted)",
                }}
              >
                Lv.{rank.level}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
