"use client";

import { Flame, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import type { StreakData } from "@/types/leaderboard";

// ─── Day labels ───────────────────────────────────────────────────────────────

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

// ─── DayPill ─────────────────────────────────────────────────────────────────

function DayPill({
  day,
  active,
  isToday,
  index,
}: {
  day: string;
  active: boolean;
  isToday: boolean;
  index: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.06, type: "spring", stiffness: 260, damping: 18 }}
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border relative"
        style={
          active
            ? {
                background: "var(--color-success)",
                borderColor: "var(--color-success)",
                color: "#fff",
              }
            : isToday
              ? {
                  background: "transparent",
                  borderColor: "var(--color-amber)",
                  color: "var(--color-amber)",
                }
              : {
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-muted)",
                }
        }
        aria-label={`${day}: ${active ? "completed" : isToday ? "today" : "missed"}`}
      >
        {active ? "✓" : ""}

        {/* Today: amber pulsing ring */}
        {isToday && !active && (
          <span
            className="absolute inset-0 rounded-full border-2 animate-ping"
            style={{ borderColor: "var(--color-amber)", opacity: 0.5 }}
            aria-hidden="true"
          />
        )}
      </motion.div>
      <span className="text-[9px] font-semibold" style={{ color: "var(--color-text-muted)" }}>
        {day}
      </span>
    </div>
  );
}

// ─── StreakCard ───────────────────────────────────────────────────────────────

interface StreakCardProps {
  data: StreakData;
}

// Today = index of last "active" day, or the first "false" after a run of "true"
function getTodayIndex(weekActivity: boolean[]): number {
  // Find last active day
  let last = -1;
  for (let i = 0; i < weekActivity.length; i++) {
    if (weekActivity[i]) last = i;
  }
  return last + 1 < weekActivity.length ? last + 1 : last;
}

export function StreakCard({ data }: StreakCardProps) {
  const todayIndex = getTodayIndex(data.weekActivity);

  return (
    <div className="neu-card-lg rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} style={{ color: "#F97316" }} aria-hidden="true" />
        <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
          Your Streak
        </h3>
      </div>

      {/* Streak count */}
      <div className="text-center mb-4">
        <span
          className="text-5xl font-black tabular-nums font-mono"
          style={{ color: "var(--color-amber)" }}
          aria-label={`${data.currentStreak} day streak`}
        >
          {data.currentStreak}
        </span>
        <span className="text-base font-semibold ml-2" style={{ color: "var(--color-text-secondary)" }}>
          Days
        </span>
        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
          Keep it up! 🔥
        </p>
      </div>

      {/* 7-day pill row */}
      <div className="flex justify-between mb-4" role="list" aria-label="Weekly activity">
        {DAY_LABELS.map((day, i) => (
          <DayPill
            key={i}
            day={day}
            active={data.weekActivity[i] ?? false}
            isToday={i === todayIndex}
            index={i}
          />
        ))}
      </div>

      {/* Longest streak */}
      <div
        className="flex items-center gap-2 justify-center text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        <Trophy size={12} style={{ color: "var(--color-amber)" }} aria-hidden="true" />
        <span className="font-mono font-semibold" style={{ color: "var(--color-text-secondary)" }}>
          Longest: {data.longestStreak} days
        </span>
      </div>
    </div>
  );
}
