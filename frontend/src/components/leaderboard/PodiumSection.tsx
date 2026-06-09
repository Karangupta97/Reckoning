"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Gift, BadgeCheck, Crown } from "lucide-react";
import type { AnyEntry } from "@/types/leaderboard";
import { isCitizenEntry } from "@/types/leaderboard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PodiumSectionProps {
  topThree: AnyEntry[];
  totalCount: number;
  visibleCount: number;
  onSelect: (entry: AnyEntry) => void;
  onHighlightMe: () => void;
  showHighlightMe: boolean;
}

// ─── Medal configs ────────────────────────────────────────────────────────────

const MEDAL_CONFIGS = [
  {
    place: 1,
    medal: "🥇",
    ringColor: "#FFD700",
    glow: "rgba(255,215,0,0.35)",
    barGradient: "linear-gradient(180deg, rgba(245,158,11,0.45) 0%, rgba(245,158,11,0.08) 100%)",
    barBorder: "rgba(245,158,11,0.55)",
    reward: "1,000",
    avatarCls: "w-20 h-20 text-xl",
    translateY: "translate-y-0",
    barHeightPx: 96,
    order: 1,
    dataIdx: 0,
  },
  {
    place: 2,
    medal: "🥈",
    ringColor: "#94A3B8",
    glow: "rgba(148,163,184,0.28)",
    barGradient: "linear-gradient(180deg, rgba(148,163,184,0.28) 0%, rgba(148,163,184,0.04) 100%)",
    barBorder: "rgba(148,163,184,0.45)",
    reward: "500",
    avatarCls: "w-16 h-16 text-base",
    translateY: "translate-y-4",
    barHeightPx: 64,
    order: 0,
    dataIdx: 1,
  },
  {
    place: 3,
    medal: "🥉",
    ringColor: "#CD7F32",
    glow: "rgba(205,127,50,0.28)",
    barGradient: "linear-gradient(180deg, rgba(205,127,50,0.28) 0%, rgba(205,127,50,0.04) 100%)",
    barBorder: "rgba(205,127,50,0.45)",
    reward: "250",
    avatarCls: "w-16 h-16 text-base",
    translateY: "translate-y-4",
    barHeightPx: 48,
    order: 2,
    dataIdx: 2,
  },
] as const;

// ─── CrownSVG ─────────────────────────────────────────────────────────────────

function CrownIcon() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.3 }}
      className="absolute -top-6 left-1/2 -translate-x-1/2"
      aria-hidden="true"
    >
      <Crown size={22} fill="#FFD700" stroke="#F59E0B" strokeWidth={1.5} />
    </motion.div>
  );
}

// ─── DeltaPill ────────────────────────────────────────────────────────────────

function DeltaPill({ delta }: { delta: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1"
      style={{
        background: "rgba(34,197,94,0.15)",
        color: "var(--color-success)",
      }}
    >
      +{delta.toLocaleString()} XP
    </span>
  );
}

// ─── PodiumCard ───────────────────────────────────────────────────────────────

function PodiumCard({
  entry,
  cfg,
  onSelect,
}: {
  entry: AnyEntry;
  cfg: (typeof MEDAL_CONFIGS)[number];
  onSelect: (e: AnyEntry) => void;
}) {
  const isFirst = cfg.place === 1;
  const label = isCitizenEntry(entry)
    ? `${entry.points.toLocaleString()} XP`
    : `${entry.issuesResolved} solved`;
  const delta = isCitizenEntry(entry) ? entry.pointsDeltaWeek : entry.pointsDeltaWeek;

  return (
    <motion.button
      initial={{ opacity: 0, y: isFirst ? -20 : 14, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 20,
        delay: cfg.order * 0.12,
      }}
      onClick={() => onSelect(entry)}
      className={`flex flex-col items-center flex-1 max-w-[140px] focus:outline-none group ${cfg.translateY}`}
      aria-label={`${cfg.place}${cfg.place === 1 ? "st" : cfg.place === 2 ? "nd" : "rd"} place: ${entry.name} – ${label}`}
    >
      {/* Medal */}
      <span className={`mb-1 select-none leading-none ${isFirst ? "text-3xl" : "text-2xl"}`}>
        {cfg.medal}
      </span>

      {/* Avatar */}
      <div className="relative">
        {isFirst && <CrownIcon />}
        {/* Glow behind avatar */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-300"
          style={{ background: cfg.glow }}
          aria-hidden="true"
        />
        <div
          className={`relative ${cfg.avatarCls} rounded-full flex items-center justify-center font-black text-white flex-shrink-0`}
          style={{
            background: entry.avatarColor,
            border: `3px solid ${cfg.ringColor}`,
            boxShadow: `0 0 0 2px ${cfg.glow}, 0 8px 24px ${cfg.glow}`,
          }}
        >
          {entry.initial}
        </div>
      </div>

      {/* Name */}
      <div className="mt-3 text-center px-1 w-full">
        <div className="flex items-center justify-center gap-1">
          <span
            className={`font-bold truncate max-w-[110px] ${isFirst ? "text-sm" : "text-xs"}`}
            style={{ color: "var(--color-text-primary)" }}
          >
            {entry.name.split(" ")[0]}
          </span>
          {isCitizenEntry(entry) && entry.isVerifiedUser && (
            <BadgeCheck size={12} style={{ color: "var(--color-info)" }} aria-label="Verified" />
          )}
        </div>

        {/* XP */}
        <span
          className={`font-black tabular-nums font-mono ${isFirst ? "text-base" : "text-sm"}`}
          style={{ color: "var(--color-amber)" }}
        >
          {label}
        </span>

        {/* +XP delta */}
        <DeltaPill delta={delta} />

        {/* Reward pill */}
        <div
          className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border"
          style={{
            background: `color-mix(in srgb, ${cfg.ringColor} 12%, transparent)`,
            borderColor: `color-mix(in srgb, ${cfg.ringColor} 35%, transparent)`,
            color: cfg.ringColor,
          }}
        >
          <Gift size={8} aria-hidden="true" />
          +{cfg.reward} XP
        </div>
      </div>

      {/* Podium bar — animated height on mount */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 22, delay: cfg.order * 0.1 + 0.2 }}
        style={{
          height: cfg.barHeightPx,
          background: cfg.barGradient,
          borderTop: `2px solid ${cfg.barBorder}`,
          borderLeft: `1px solid ${cfg.barBorder}`,
          borderRight: `1px solid ${cfg.barBorder}`,
          transformOrigin: "bottom",
        }}
        className="w-full rounded-t-xl mt-3"
        aria-hidden="true"
      />
    </motion.button>
  );
}

// ─── PodiumSection ────────────────────────────────────────────────────────────

export function PodiumSection({
  topThree,
  totalCount,
  visibleCount,
  onSelect,
  onHighlightMe,
  showHighlightMe,
}: PodiumSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="neu-card-lg rounded-2xl overflow-hidden"
      aria-label="Top 3 leaderboard"
    >
      {/* Dark gradient bg with amber radial glow */}
      <div
        className="relative px-4 pt-10 pb-0"
        style={{
          background:
            "linear-gradient(160deg, var(--color-surface) 0%, var(--color-page) 100%)",
        }}
      >
        {/* Amber radial glow at center-top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(245,158,11,0.18) 0%, transparent 80%)",
          }}
          aria-hidden="true"
        />

        {/* Podium columns: 2nd | 1st | 3rd */}
        <div className="relative flex items-end justify-center gap-4 sm:gap-8">
          {([1, 0, 2] as const).map((dataIdx) => {
            const entry = topThree[dataIdx];
            const cfg = MEDAL_CONFIGS[dataIdx];
            if (!entry || !cfg) return null;
            return (
              <PodiumCard
                key={dataIdx}
                entry={entry}
                cfg={cfg}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom strip */}
      <div
        className="flex items-center justify-between px-4 py-3 border-t"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-card)",
        }}
      >
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Showing Top {visibleCount} of {totalCount}
        </span>

        {showHighlightMe && (
          <button
            onClick={onHighlightMe}
            className="btn-outline flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
            aria-label="Scroll to and highlight my rank"
          >
            ☆ Highlight Me
          </button>
        )}
      </div>
    </div>
  );
}
