"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { LEADERBOARD } from "../mockData";
import type { LeaderboardScope } from "../types";

const TABS: { key: LeaderboardScope; label: string }[] = [
  { key: "sub-district", label: "Sub-District" },
  { key: "district", label: "District" },
  { key: "state", label: "State" },
  { key: "national", label: "National" },
];

const MEDAL_COLORS = ["#F59E0B", "#94A3B8", "#CD7F32"];

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardScope>("district");
  const router = useRouter();
  const topThree = LEADERBOARD.slice(0, 3);
  const restEntries = LEADERBOARD.slice(3);

  return (
    <div className="neu-card p-5 sm:p-6 h-full">
      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
          Leaderboard
        </h3>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative px-2.5 py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors duration-200"
              style={{
                color: activeTab === tab.key ? "var(--color-text-primary)" : "var(--color-text-muted)",
                background: activeTab === tab.key ? "var(--color-card)" : "transparent",
                boxShadow: activeTab === tab.key ? "var(--shadow-neu)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Podium - Top 3 */}
      <div className="flex items-end justify-center gap-3 sm:gap-4 mb-5">
        {/* 2nd place */}
        <PodiumCard entry={topThree[1]} medal="🥈" height="h-20" />
        {/* 1st place */}
        <PodiumCard entry={topThree[0]} medal="🥇" height="h-24" isFirst />
        {/* 3rd place */}
        <PodiumCard entry={topThree[2]} medal="🥉" height="h-16" />
      </div>

      {/* Table */}
      <div className="overflow-y-auto max-h-48 sm:max-h-56 scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] sm:text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
              <th className="text-left py-2 font-medium">Rank</th>
              <th className="text-left py-2 font-medium">User</th>
              <th className="text-right py-2 font-medium">Points</th>
              <th className="text-right py-2 font-medium hidden sm:table-cell">Reports</th>
              <th className="text-right py-2 font-medium hidden sm:table-cell">Reputation</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {restEntries.map((entry) => (
                <motion.tr
                  key={entry.rank}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-xs sm:text-sm border-b border-[var(--color-border)] transition-colors duration-200 ${
                    entry.isCurrentUser
                      ? "bg-[color-mix(in_srgb,var(--color-amber)_8%,transparent)]"
                      : "hover:bg-[var(--color-surface)]"
                  }`}
                >
                  <td className="py-2.5 font-bold text-[var(--color-text-muted)] tabular-nums">
                    {entry.rank}
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: entry.avatarColor }}
                      >
                        {entry.initial}
                      </div>
                      <span
                        className="font-medium truncate"
                        style={{
                          color: entry.isCurrentUser ? "var(--color-amber)" : "var(--color-text-primary)",
                        }}
                      >
                        {entry.name}
                        {entry.isCurrentUser && (
                          <span className="text-[10px] ml-1 text-[var(--color-text-muted)]">(You)</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-semibold tabular-nums text-[var(--color-text-secondary)]">
                    {entry.points.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-[var(--color-text-muted)] hidden sm:table-cell">
                    {entry.reports}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-[var(--color-text-muted)] hidden sm:table-cell">
                    {entry.reputation}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <button
        onClick={() => router.push("/dashboard/leaderboard")}
        className="w-full mt-4 py-2.5 rounded-xl border border-[var(--color-border)] text-xs font-medium text-[var(--color-info)] hover:bg-[var(--color-surface)] transition-colors duration-200 flex items-center justify-center gap-1.5"
        aria-label="Navigate to full leaderboard page"
      >
        View full leaderboard →
      </button>
    </div>
  );
}

/* ─── Podium Card ──────────────────────────────────────────────── */

function PodiumCard({
  entry,
  medal,
  height,
  isFirst,
}: {
  entry: (typeof LEADERBOARD)[number];
  medal: string;
  height: string;
  isFirst?: boolean;
}) {
  return (
    <div className="flex flex-col items-center flex-1 max-w-[120px]">
      {/* Medal */}
      <span className={`text-lg sm:text-xl ${isFirst ? "text-2xl sm:text-3xl" : ""}`}>
        {medal}
      </span>

      {/* Avatar */}
      <div
        className={`${isFirst ? "w-12 h-12 sm:w-14 sm:h-14" : "w-9 h-9 sm:w-10 sm:h-10"} rounded-full flex items-center justify-center text-white font-bold mt-1 border-2`}
        style={{
          background: entry.avatarColor,
          borderColor: isFirst ? "#F59E0B" : "var(--color-border)",
          boxShadow: isFirst ? "0 0 16px rgba(245,158,11,0.3)" : "none",
        }}
      >
        <span className={isFirst ? "text-base sm:text-lg" : "text-xs sm:text-sm"}>
          {entry.initial}
        </span>
      </div>

      {/* Name + Points */}
      <span className="mt-1.5 text-[10px] sm:text-xs font-semibold text-[var(--color-text-primary)] text-center truncate w-full">
        {entry.name}
      </span>
      <span className="text-[9px] sm:text-[10px] font-bold text-[var(--color-amber)] tabular-nums">
        {entry.points.toLocaleString()} XP
      </span>

      {/* Podium bar */}
      <div
        className={`w-full ${height} rounded-t-lg mt-1.5 border border-b-0 border-[var(--color-border)]`}
        style={{
          background: isFirst
            ? "linear-gradient(180deg, color-mix(in srgb, var(--color-amber) 15%, transparent), var(--color-surface))"
            : "var(--color-surface)",
        }}
      />
    </div>
  );
}
