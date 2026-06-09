"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Star } from "lucide-react";
import { LEADERBOARD } from "../mockData";
import type { LeaderboardScope } from "../types";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { key: LeaderboardScope; label: string }[] = [
  { key: "sub-district", label: "Sub-Dist" },
  { key: "district",     label: "District" },
  { key: "state",        label: "State"    },
  { key: "national",     label: "National" },
];

const MEDALS = ["🥇", "🥈", "🥉"] as const;

// Podium order: 2nd · 1st · 3rd
const PODIUM_ORDER = [1, 0, 2] as const;

// Bar heights for the three podium slots (2nd, 1st, 3rd)
const PODIUM_BAR_H = ["h-10", "h-16", "h-7"] as const;

// Avatar sizes for podium (2nd, 1st, 3rd)
const PODIUM_AVATAR_SIZE = [
  "w-11 h-11 text-sm",
  "w-[52px] h-[52px] text-base",
  "w-[44px] h-[44px] text-sm",
] as const;

// Podium ring colors
const PODIUM_RING = [
  "#94A3B8",  // silver
  "#F59E0B",  // gold
  "#CD7F32",  // bronze
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardScope>("district");
  const router = useRouter();

  const top3    = LEADERBOARD.slice(0, 3);
  const rest    = LEADERBOARD.slice(3);

  return (
    <div className="neu-card p-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Leaderboard
        </h3>

        {/* Segmented pill tabs */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-full"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="relative px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all duration-200 whitespace-nowrap"
                style={{
                  color: active ? "#fff" : "var(--color-text-muted)",
                  background: active
                    ? "var(--color-teal, #14b8a6)"
                    : "transparent",
                  boxShadow: active
                    ? "0 0 8px color-mix(in srgb, #14b8a6 40%, transparent)"
                    : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Podium ── */}
      <div
        className="rounded-xl px-2 pt-3 pb-0 mb-3"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-end justify-center gap-2">
          {PODIUM_ORDER.map((dataIdx, podiumSlot) => {
            const entry     = top3[dataIdx];
            const medalSlot = dataIdx; // 0=gold,1=silver,2=bronze
            const isFirst   = dataIdx === 0;

            return (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: podiumSlot * 0.08 }}
                className="flex flex-col items-center flex-1 max-w-[100px]"
              >
                {/* Medal */}
                <span className={`mb-1 leading-none ${isFirst ? "text-2xl" : "text-xl"}`}>
                  {MEDALS[medalSlot]}
                </span>

                {/* Avatar */}
                <div
                  className={`${PODIUM_AVATAR_SIZE[podiumSlot]} rounded-full flex items-center justify-center font-bold text-white border-2 transition-all`}
                  style={{
                    background: entry.avatarColor,
                    borderColor: PODIUM_RING[medalSlot],
                    boxShadow: isFirst
                      ? `0 0 16px color-mix(in srgb, ${PODIUM_RING[0]} 35%, transparent)`
                      : "none",
                  }}
                >
                  {entry.initial}
                </div>

                {/* Name */}
                <span className="mt-1.5 text-[10px] font-semibold text-center leading-tight w-full truncate px-1"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {entry.name.split(" ")[0]}
                </span>

                {/* XP in amber */}
                <span className="text-[9px] font-bold tabular-nums"
                  style={{ color: "var(--color-amber)" }}
                >
                  {entry.points.toLocaleString()} XP
                </span>

                {/* Podium step bar */}
                <div
                  className={`w-full ${PODIUM_BAR_H[podiumSlot]} rounded-t-lg mt-2`}
                  style={{
                    background: isFirst
                      ? "linear-gradient(180deg, color-mix(in srgb, var(--color-amber) 18%, transparent), color-mix(in srgb, var(--color-amber) 5%, transparent))"
                      : podiumSlot === 0
                      ? "color-mix(in srgb, #94A3B8 10%, transparent)"
                      : "color-mix(in srgb, #CD7F32 10%, transparent)",
                    borderTop: `2px solid ${PODIUM_RING[medalSlot]}`,
                    borderLeft: `1px solid color-mix(in srgb, ${PODIUM_RING[medalSlot]} 30%, transparent)`,
                    borderRight: `1px solid color-mix(in srgb, ${PODIUM_RING[medalSlot]} 30%, transparent)`,
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--color-border)" }}
      >
        {/* Column headings */}
        <div
          className="grid text-[9px] font-semibold uppercase tracking-wide px-3 py-1.5"
          style={{
            color: "var(--color-text-muted)",
            background: "var(--color-surface)",
            gridTemplateColumns: "28px 1fr 64px 44px 56px",
          }}
        >
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Points</span>
          <span className="text-right hidden sm:block">Rep</span>
          <span className="text-right hidden sm:block">Reports</span>
        </div>

        {/* Rows */}
        <AnimatePresence>
          {rest.map((entry, i) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22, delay: i * 0.03 }}
              className="grid items-center px-3 py-2 transition-colors duration-150"
              style={{
                gridTemplateColumns: "28px 1fr 64px 44px 56px",
                background: entry.isCurrentUser
                  ? "color-mix(in srgb, var(--color-amber) 8%, transparent)"
                  : i % 2 === 0
                  ? "var(--color-card)"
                  : "var(--color-surface)",
                borderTop: "1px solid var(--color-border)",
              }}
            >
              {/* Rank */}
              <span
                className="text-xs font-bold tabular-nums"
                style={{
                  color: entry.isCurrentUser
                    ? "var(--color-amber)"
                    : "var(--color-text-muted)",
                }}
              >
                {entry.rank}
              </span>

              {/* Avatar + Name */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: entry.avatarColor }}
                >
                  {entry.initial}
                </div>
                <span
                  className="text-xs font-medium truncate leading-tight"
                  style={{
                    color: entry.isCurrentUser
                      ? "var(--color-amber)"
                      : "var(--color-text-primary)",
                  }}
                >
                  {entry.name}
                  {entry.isCurrentUser && (
                    <span className="text-[9px] ml-1" style={{ color: "var(--color-text-muted)" }}>
                      (You)
                    </span>
                  )}
                </span>
              </div>

              {/* Points */}
              <span
                className="text-right text-[11px] font-semibold tabular-nums"
                style={{ color: "var(--color-amber)" }}
              >
                {entry.points.toLocaleString()}
              </span>

              {/* Reputation */}
              <div className="hidden sm:flex items-center justify-end gap-0.5">
                <Star size={9} style={{ color: "var(--color-text-muted)" }} />
                <span className="text-[10px] tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                  {entry.reputation}
                </span>
              </div>

              {/* Reports */}
              <div className="hidden sm:flex items-center justify-end gap-0.5">
                <FileText size={9} style={{ color: "var(--color-text-muted)" }} />
                <span className="text-[10px] tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                  {entry.reports}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── View full leaderboard ── */}
      <button
        onClick={() => router.push("/dashboard/leaderboard")}
        className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors duration-200"
        style={{
          color: "var(--color-teal, #14b8a6)",
          border: "1px solid color-mix(in srgb, #14b8a6 25%, transparent)",
          background: "color-mix(in srgb, #14b8a6 5%, transparent)",
        }}
        aria-label="View full leaderboard"
      >
        View full leaderboard
        <ArrowRight size={13} strokeWidth={2.2} />
      </button>
    </div>
  );
}
