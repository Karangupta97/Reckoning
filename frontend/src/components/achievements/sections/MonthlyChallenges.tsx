"use client";

import { motion } from "framer-motion";
import { Gift, Clock } from "lucide-react";
import { CHALLENGES } from "../mockData";

export function MonthlyChallenges() {
  return (
    <div className="neu-card p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
          Monthly Challenges
        </h3>
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-[var(--color-amber)] font-medium">
          <Clock size={12} strokeWidth={2.2} />
          Ends in {CHALLENGES[0]?.endsAt}
        </span>
      </div>

      <div className="space-y-4">
        {CHALLENGES.map((challenge) => {
          const percent = (challenge.progress / challenge.total) * 100;
          const isComplete = challenge.progress >= challenge.total;

          return (
            <div
              key={challenge.id}
              className="p-3 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-amber)] transition-colors duration-200"
            >
              {/* Title row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs sm:text-sm font-medium text-[var(--color-text-primary)] leading-tight">
                  {challenge.title}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)] whitespace-nowrap tabular-nums">
                  {challenge.progress} / {challenge.total}
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative w-full h-2 rounded-full overflow-hidden bg-[var(--color-border)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] as [number, number, number, number], delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{
                    background: isComplete
                      ? "var(--color-success)"
                      : "linear-gradient(90deg, var(--color-amber), #F97316)",
                    boxShadow: `0 0 8px color-mix(in srgb, var(--color-amber) 40%, transparent)`,
                  }}
                />
              </div>

              {/* Reward */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)]">
                  {Math.round(percent)}% complete
                </span>
                <span className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[var(--color-amber)]">
                  <Gift size={12} strokeWidth={2.2} />
                  {challenge.reward} {challenge.rewardType.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full mt-4 py-2.5 rounded-xl border border-[var(--color-border)] text-xs font-medium text-[var(--color-info)] hover:bg-[var(--color-surface)] transition-colors duration-200">
        View all challenges
      </button>
    </div>
  );
}
