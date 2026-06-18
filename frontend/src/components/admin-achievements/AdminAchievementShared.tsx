"use client";

/**
 * AdminAchievementShared.tsx
 *
 * Shared achievement UI components used by both District Admin and Sub-District Admin
 * achievement pages. Fix once, reuse everywhere.
 *
 * Exports:
 *   - RankProgressTrack  — grid-based milestone nodes, no overlap, readable labels
 *   - AchievementTimeline — vertical timeline, line strictly behind icons
 */

import { motion } from "framer-motion";
import {
  Trophy, Star, Flame, Zap, Award,
  ShieldCheck, CheckCircle2, Camera, Landmark,
} from "lucide-react";
import type { AdminRankInfo, AdminAchievementEvent } from "@/store/achievementStore";

// ─── Rank icon lookup ─────────────────────────────────────────────────────────

const RANK_ICON: Record<string, React.ReactNode> = {
  shield:  <ShieldCheck size={18} />,
  zap:     <Zap size={18} />,
  award:   <Award size={18} />,
  trophy:  <Trophy size={18} />,
  star:    <Star size={18} />,
  flame:   <Flame size={18} />,
};

// ─── Timeline icon lookup ─────────────────────────────────────────────────────

const TL_ICON: Record<string, React.ReactNode> = {
  trophy:           <Trophy size={15} />,
  flame:            <Flame size={15} />,
  award:            <Award size={15} />,
  "check-circle":   <CheckCircle2 size={15} />,
  "shield-check":   <ShieldCheck size={15} />,
  camera:           <Camera size={15} />,
  landmark:         <Landmark size={15} />,
  zap:              <Zap size={15} />,
  star:             <Star size={15} />,
  shield:           <ShieldCheck size={15} />,
};

const EVENT_COLOR: Record<string, string> = {
  rank:      "#F59E0B",
  badge:     "#8B5CF6",
  points:    "#3B82F6",
  action:    "#22C55E",
  streak:    "#F97316",
  milestone: "#14b8a6",
};

// ─────────────────────────────────────────────────────────────────────────────
// RankProgressTrack
// ─────────────────────────────────────────────────────────────────────────────
//
// Grid approach: one column per rank, each column is 1fr.
// The horizontal line is drawn via an absolutely-positioned <div> that spans
// left-center-of-col-1 → right-center-of-col-N.  We achieve this by giving
// the line container left/right padding equal to half the node size (20px).
// Labels sit below the nodes in the same grid cell — they are never clipped.
//

const NODE_SIZE = 40; // px — icon node diameter
const HALF_NODE = NODE_SIZE / 2;

interface RankProgressTrackProps {
  ranks:       AdminRankInfo[];
  currentRank: AdminRankInfo;
  accentColor?: string;
}

export function RankProgressTrack({
  ranks,
  currentRank,
  accentColor = "#F59E0B",
}: RankProgressTrackProps) {
  const n             = ranks.length;
  const filledSegments = Math.max(0, currentRank.level - 1); // segments before current node
  const totalSegments  = Math.max(1, n - 1);
  const filledPct      = (filledSegments / totalSegments) * 100;

  return (
    <div className="w-full">

      {/* ── Track line layer ─────────────────────────────────
          Sits BEHIND the nodes via z-index 0.
          left/right padding = HALF_NODE so the line starts/ends
          at the centre of the first and last node columns.          */}
      <div
        className="relative"
        style={{ paddingLeft: HALF_NODE, paddingRight: HALF_NODE, marginBottom: "-" + (NODE_SIZE / 2 + 1) + "px" }}
      >
        {/* Grey background track */}
        <div
          style={{
            height: "3px",
            borderRadius: "9999px",
            background: "var(--color-border)",
            position: "relative",
            zIndex: 0,
          }}
        />
        {/* Coloured fill — animated */}
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${filledPct}%` }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "3px",
            borderRadius: "9999px",
            background: `linear-gradient(90deg, #22C55E, ${accentColor})`,
            zIndex: 0,
          }}
        />
      </div>

      {/* ── Nodes + labels layer ─────────────────────────────
          CSS grid, each column = 1fr so nodes space evenly.
          z-index 1 so nodes sit on top of the track line.           */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${n}, 1fr)`,
          position: "relative",
          zIndex: 1,
        }}
      >
        {ranks.map((r, idx) => {
          const isActive    = r.level === currentRank.level;
          const isCompleted = r.level <  currentRank.level;
          const isFuture    = r.level >  currentRank.level;

          return (
            <div
              key={r.level}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                paddingTop: "0",
              }}
            >
              {/* Icon node — solid bg masks the track line */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: isActive ? 1.15 : 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                style={{
                  width:  NODE_SIZE,
                  height: NODE_SIZE,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  /* Solid background — hides the track line fully */
                  background: isActive
                    ? `color-mix(in srgb, ${r.color} 20%, var(--color-card))`
                    : isCompleted
                    ? `color-mix(in srgb, ${r.color} 10%, var(--color-card))`
                    : "var(--color-card)",
                  border: `2px solid ${isFuture ? "var(--color-border)" : r.color}`,
                  boxShadow: isActive
                    ? `0 0 0 4px color-mix(in srgb, ${r.color} 18%, transparent), 0 0 16px color-mix(in srgb, ${r.color} 40%, transparent)`
                    : "none",
                  color: isFuture ? "var(--color-text-muted)" : r.color,
                  opacity: isFuture ? 0.5 : 1,
                }}
              >
                {RANK_ICON[r.icon] ?? <Award size={18} />}
              </motion.div>

              {/* Title — no max-width, wraps naturally inside 1fr cell */}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  textAlign: "center",
                  lineHeight: "1.35",
                  color: isActive
                    ? r.color
                    : isFuture
                    ? "var(--color-text-muted)"
                    : "var(--color-text-secondary)",
                  /* Allow wrapping but keep it tidy */
                  wordBreak: "break-word",
                  padding: "0 4px",
                }}
              >
                {r.title}
              </span>

              {/* Level pill */}
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "9999px",
                  background: isActive
                    ? `color-mix(in srgb, ${r.color} 16%, transparent)`
                    : "var(--color-surface)",
                  color: isFuture ? "var(--color-text-muted)" : r.color,
                  border: `1px solid ${isActive ? `color-mix(in srgb, ${r.color} 30%, transparent)` : "transparent"}`,
                  marginTop: "-4px",
                }}
              >
                Lv.{r.level}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AchievementTimeline
// ─────────────────────────────────────────────────────────────────────────────
//
// The vertical line is absolutely positioned at left = (iconSize/2 - 0.5)px.
// Each icon circle has a solid background + a box-shadow ring to fully mask
// the line where it crosses.  z-index: line=0, icon=1, content=2.
//

const ICON_SIZE = 34; // px

interface AchievementTimelineProps {
  events: AdminAchievementEvent[];
  accentColor?: string;
}

export function AchievementTimeline({
  events,
  accentColor = "#14b8a6",
}: AchievementTimelineProps) {
  return (
    <div style={{ position: "relative" }}>

      {/* Vertical track line — z:0, behind everything */}
      {events.length > 1 && (
        <div
          style={{
            position: "absolute",
            left: ICON_SIZE / 2 - 1 + "px",   /* centre of icon minus half line-width */
            top:  ICON_SIZE / 2 + "px",         /* start at centre of first icon */
            bottom: ICON_SIZE / 2 + "px",        /* end at centre of last icon */
            width: "2px",
            borderRadius: "9999px",
            background: "var(--color-border)",
            zIndex: 0,
          }}
        />
      )}

      {/* Events */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {events.map((item, i) => {
          const color = EVENT_COLOR[item.type] ?? accentColor;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "8px 0",
              }}
            >
              {/* Icon — z:1, solid bg + shadow ring masks the line */}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  flexShrink: 0,
                  width:  ICON_SIZE,
                  height: ICON_SIZE,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  /* Two-layer background: card colour first, then tint */
                  background: `color-mix(in srgb, ${color} 16%, var(--color-card))`,
                  border: `1.5px solid color-mix(in srgb, ${color} 35%, transparent)`,
                  color,
                  /* Ring shadow the same colour as the card to mask line */
                  boxShadow: `0 0 0 3px var(--color-card)`,
                }}
              >
                {TL_ICON[item.icon] ?? <Award size={15} />}
              </div>

              {/* Content — z:2 via natural stacking */}
              <div style={{ flex: 1, minWidth: 0, paddingTop: "2px", position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                      lineHeight: "1.4",
                    }}
                  >
                    {item.title}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--color-text-muted)",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.timeAgo}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--color-text-secondary)",
                    marginTop: "3px",
                    lineHeight: "1.5",
                  }}
                >
                  {item.description}
                </p>

                {item.xpGained && (
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "9999px",
                      marginTop: "4px",
                      background: `color-mix(in srgb, ${color} 14%, transparent)`,
                      color,
                    }}
                  >
                    +{item.xpGained} XP
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


// ─── Icon map shared between both components ──────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  trophy:         <Trophy size={16} />,
  flame:          <Flame size={16} />,
  award:          <Award size={16} />,
  "check-circle": <CheckCircle2 size={16} />,
  "shield-check": <ShieldCheck size={16} />,
  camera:         <Camera size={16} />,
  landmark:       <Landmark size={16} />,
  zap:            <Zap size={16} />,
  star:           <Star size={16} />,
  shield:         <ShieldCheck size={16} />,
};

const RANK_ICON_MAP: Record<string, React.ReactNode> = {
  shield:  <ShieldCheck size={16} />,
  zap:     <Zap size={16} />,
  award:   <Award size={16} />,
  trophy:  <Trophy size={16} />,
  star:    <Star size={16} />,
  flame:   <Flame size={16} />,
};

// ─── EVENT type colours ────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  rank:      "#F59E0B",
  badge:     "#8B5CF6",
  points:    "#3B82F6",
  action:    "#22C55E",
  streak:    "#F97316",
  milestone: "#14b8a6",
};

// ─────────────────────────────────────────────────────────────────────────────
// RankProgressTrack
// ─────────────────────────────────────────────────────────────────────────────
//
// Layout strategy that prevents overlap:
//  - Icon nodes are a FIXED 36px square, centered in their column flex cell
//  - The line is absolutely positioned at top = (36/2)px = 18px, which is
//    exactly the vertical centre of the icon nodes
//  - Icons have a solid card-background fill so the line never shows through
//  - z-index: line=1, fill-line=2, nodes=10
//  - Labels sit in a separate row below, not overlapping nodes
//

interface RankProgressTrackProps {
  ranks:       AdminRankInfo[];
  currentRank: AdminRankInfo;
  /** Gradient end colour for the filled portion (defaults to amber) */
  accentColor?: string;
}

