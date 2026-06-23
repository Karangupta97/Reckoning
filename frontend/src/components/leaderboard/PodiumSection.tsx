"use client";

import { useRef, useState } from "react";
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

// ─── Star Particles background ────────────────────────────────────────────────

const STAR_PARTICLES = [
  { top: "6%", left: "10%", delay: 0.1 },
  { top: "22%", left: "4%", delay: 0.7 },
  { top: "10%", left: "26%", delay: 0.3 },
  { top: "3%", left: "50%", delay: 0.9 },
  { top: "12%", left: "68%", delay: 0.2 },
  { top: "8%", left: "86%", delay: 0.6 },
  { top: "20%", left: "94%", delay: 0.4 },
];

function FloatingStars() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {STAR_PARTICLES.map((p, idx) => (
        <motion.div
          key={idx}
          className="absolute text-[9px] sm:text-[11px]"
          style={{
            top: p.top,
            left: p.left,
            color: "color-mix(in srgb, var(--color-amber) 70%, var(--color-card) 30%)",
          }}
          animate={{
            y: [0, -8, 0],
            opacity: [0.15, 0.45, 0.15],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 4.5 + (idx % 3),
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        >
          ✦
        </motion.div>
      ))}
    </div>
  );
}

// ─── LaurelBranch + LaurelWreath ─────────────────────────────────────────────

function LaurelBranch({ color, side = "left" }: { color: string; side?: "left" | "right" }) {
  return (
    <svg viewBox="0 0 70 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M58 14 C46 26 38 44 36 62 C34 80 38 96 46 110"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
      {Array.from({ length: 7 }).map((_, i) => {
        const y = 20 + i * 12;
        const x = 50 - i * 2;
        return (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx="6"
            ry="3"
            fill={color}
            opacity={0.95 - i * 0.06}
            transform={`rotate(${side === "left" ? -30 : 30} ${x} ${y})`}
          />
        );
      })}
    </svg>
  );
}

function LaurelWreath({
  color,
  place,
  opacity = 0.85,
}: {
  color: string;
  place: number;
  opacity?: number;
}) {
  const desktop =
    place === 1
      ? { left: "-18%", width: "30%", height: "65%" }
      : { left: "-18%", width: "22%", height: "50%" };
  const mobile =
    place === 1
      ? { left: "-14%", width: "20%", height: "55%" }
      : { left: "-14%", width: "18%", height: "50%" };

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {/* Desktop laurels */}
      <div
        className="hidden md:block absolute top-1/2 -translate-y-1/2"
        style={{ left: desktop.left, width: desktop.width, height: desktop.height, opacity }}
      >
        <LaurelBranch color={color} side="left" />
      </div>
      <div
        className="hidden md:block absolute top-1/2 -translate-y-1/2"
        style={{
          right: desktop.left,
          width: desktop.width,
          height: desktop.height,
          opacity,
          transform: "scaleX(-1)",
        }}
      >
        <LaurelBranch color={color} side="right" />
      </div>

      {/* Mobile laurels */}
      <div
        className="md:hidden absolute top-1/2 -translate-y-1/2"
        style={{ left: mobile.left, width: mobile.width, height: mobile.height, opacity }}
      >
        <LaurelBranch color={color} side="left" />
      </div>
      <div
        className="md:hidden absolute top-1/2 -translate-y-1/2"
        style={{
          right: mobile.left,
          width: mobile.width,
          height: mobile.height,
          opacity,
          transform: "scaleX(-1)",
        }}
      >
        <LaurelBranch color={color} side="right" />
      </div>
    </div>
  );
}

// ─── Medal configs ────────────────────────────────────────────────────────────

const MEDAL_CONFIGS = [
  {
    place: 1,
    ringColor: "border-[var(--color-amber)]",
    glow: "rgba(245,158,11,0.15)",
    wreathColor: "var(--color-amber)",
    stepColor: "var(--color-amber)",
    numberColor: "var(--color-amber)",
    avatarCls: "w-[72px] h-[72px] sm:w-[96px] sm:h-[96px] border-[5px]",
    nameCls: "text-xs sm:text-base font-extrabold",
    pointsCls: "text-[var(--color-amber)] text-xs sm:text-base font-extrabold",
    podiumHeight: "h-16 sm:h-20",
    podiumGradient:
      "from-[color-mix(in_srgb,_var(--color-amber)_25%,_var(--color-card))] via-[color-mix(in_srgb,_var(--color-amber)_18%,_var(--color-card))]/50 to-[color-mix(in_srgb,_var(--color-amber)_10%,_var(--color-card))]",
    podiumBorder: "border-[color-mix(in_srgb,_var(--color-amber)_25%,_var(--color-border))]",
    reward: "1,000",
    rewardBg:
      "bg-[color-mix(in_srgb,_var(--color-amber)_10%,_var(--color-card))] text-[var(--color-amber)] border-[color-mix(in_srgb,_var(--color-amber)_20%,_transparent)]",
    giftIconColor: "var(--color-amber)",
    // FIX: visual order index for animation delay (1st place renders center = order 1)
    animationOrder: 1,
    dataIdx: 0,
  },
  {
    place: 2,
    ringColor:
      "border-[color-mix(in_srgb,_var(--color-text-secondary)_40%,_var(--color-border)_80%)]",
    glow: "rgba(148,163,184,0.16)",
    wreathColor: "color-mix(in srgb, var(--color-text-secondary) 85%, var(--color-card) 15%)",
    stepColor: "color-mix(in srgb, var(--color-text-secondary) 75%, var(--color-card) 25%)",
    numberColor: "color-mix(in srgb, var(--color-text-secondary) 80%, var(--color-card) 20%)",
    avatarCls: "w-14 h-14 sm:w-20 sm:h-20 border-[4px]",
    nameCls: "text-xs sm:text-sm font-bold",
    pointsCls: "text-[var(--color-text-secondary)] text-xs sm:text-sm font-extrabold",
    podiumHeight: "h-11 sm:h-14",
    podiumGradient:
      "from-[color-mix(in_srgb,_var(--color-text-secondary)_18%,_var(--color-card))] via-[color-mix(in_srgb,_var(--color-text-secondary)_12%,_var(--color-card))]/50 to-[color-mix(in_srgb,_var(--color-text-secondary)_8%,_var(--color-card))]",
    podiumBorder:
      "border-[color-mix(in_srgb,_var(--color-text-secondary)_30%,_var(--color-border))]",
    reward: "500",
    rewardBg:
      "bg-[color-mix(in_srgb,_var(--color-text-secondary)_10%,_var(--color-card))] text-[var(--color-text-secondary)] border-[color-mix(in_srgb,_var(--color-text-secondary)_20%,_transparent)]",
    giftIconColor: "var(--color-text-secondary)",
    // FIX: 2nd place renders left = order 0
    animationOrder: 0,
    dataIdx: 1,
  },
  {
    place: 3,
    ringColor: "border-[color-mix(in_srgb,_#B87333_80%,_var(--color-border)_20%)]",
    glow: "rgba(184,115,51,0.16)",
    wreathColor: "#B87333",
    stepColor: "#B87333",
    numberColor: "#A86A3D",
    avatarCls: "w-14 h-14 sm:w-20 sm:h-20 border-[4px]",
    nameCls: "text-xs sm:text-sm font-bold",
    pointsCls: "text-[var(--color-text-secondary)] text-xs sm:text-sm font-extrabold",
    podiumHeight: "h-8 sm:h-10",
    podiumGradient:
      "from-[color-mix(in_srgb,_#B87333_18%,_var(--color-card))] via-[color-mix(in_srgb,_#B87333_10%,_var(--color-card))]/50 to-[color-mix(in_srgb,_var(--color-card)_5%,_var(--color-card))]",
    podiumBorder: "border-[color-mix(in_srgb,_#B87333_18%,_var(--color-border))]",
    reward: "250",
    rewardBg:
      "bg-[color-mix(in_srgb,_#B87333_08%,_var(--color-card))] text-[#B87333] border-[color-mix(in_srgb,_#B87333_18%,_transparent)]",
    giftIconColor: "#B87333",
    // FIX: 3rd place renders right = order 2
    animationOrder: 2,
    dataIdx: 2,
  },
] as const;

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
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const isFirst = cfg.place === 1;

  // FIX: simplified — both branches were identical, no ternary needed
  const delta = entry.pointsDeltaWeek;

  // FIX: store only the numeric display string; no need to split later
  const scoreDisplay = isCitizenEntry(entry)
    ? entry.points.toLocaleString()
    : entry.issuesResolved.toString();

  const scoreUnit = isCitizenEntry(entry) ? "XP" : "solved";

  return (
    <motion.button
      initial={{ opacity: 0, y: isFirst ? -10 : 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 24,
        // FIX: use animationOrder (renamed from `order`) for clarity
        delay: cfg.animationOrder * 0.08,
      }}
      onClick={() => onSelect(entry)}
      className="flex flex-col items-center flex-1 max-w-[125px] sm:max-w-[155px] focus:outline-none group relative"
      aria-label={`${cfg.place} place: ${entry.name} – ${scoreDisplay} ${scoreUnit}`}
    >
      {/* Crown above 1st place avatar */}
      {isFirst && (
        <Crown
          size={18}
          className="absolute -top-8 left-1/2 -translate-x-1/2 z-30"
          style={{ color: "var(--color-amber)", fill: "var(--color-amber)" }}
        />
      )}

      {/* Laurels & Glowing Background */}
      <div className="relative mb-0.5 flex items-center justify-center leaderboard-avatar">
        {/* FIX: bumped 2nd/3rd opacity from 0.8 → 0.9 so wreaths are more visible */}
        <LaurelWreath
          color={cfg.wreathColor}
          place={cfg.place}
          opacity={cfg.place === 1 ? 0.9 : 0.9}
        />

        {/* Glow behind avatar (rank 1 only) */}
        {cfg.place === 1 && (
          <div
            className="absolute inset-0 rounded-full blur-lg opacity-35 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none"
            style={{ background: cfg.glow }}
          />
        )}

        {/* Profile Avatar Ring */}
        <div
          className={`relative ${cfg.avatarCls} rounded-full flex items-center justify-center font-black text-white flex-shrink-0 overflow-hidden z-10 transition-all duration-300 group-hover:scale-[1.04] bg-[var(--color-surface)] ${cfg.ringColor}`}
          style={{ boxShadow: `0 6px 16px ${cfg.glow}` }}
        >
          {entry.avatarUrl && !hasAvatarError ? (
            <img
              src={entry.avatarUrl}
              alt={entry.name}
              className="w-full h-full object-cover select-none"
              onError={() => setHasAvatarError(true)}
            />
          ) : (
            <span className={isFirst ? "text-2xl" : "text-xl"}>{entry.initial}</span>
          )}
        </div>

        {/* Rank badge, top-right of avatar */}
        <div
          className={`absolute -top-1 -right-1 z-20 flex items-center justify-center rounded-full font-extrabold text-white border-2 border-[var(--color-card)] ${
            isFirst ? "w-7 h-7 text-sm" : "w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-xs"
          }`}
          style={{ background: cfg.numberColor }}
        >
          {cfg.place}
        </div>
      </div>

      {/* Profile Details */}
      <div className="text-center w-full z-10 px-0.5 mt-0.5">
        {/* Name */}
        <div className="flex items-center justify-center gap-1">
          <span
            className={`${cfg.nameCls} truncate max-w-[75px] sm:max-w-[115px] text-[var(--color-text-primary)]`}
          >
            {entry.name.split(" ")[0]}
          </span>
          {isCitizenEntry(entry) && entry.isVerifiedUser && (
            <BadgeCheck size={13} className="text-[var(--color-info)] shrink-0" aria-label="Verified" />
          )}
        </div>

        {/* Score & weekly gain */}
        <div className="flex items-center justify-center gap-1 mt-0.5">
          {/* FIX: render scoreDisplay directly — no more .split(" ")[0] */}
          <span className={`${cfg.pointsCls} tabular-nums`}>{scoreDisplay}</span>
          {isCitizenEntry(entry) && (
            <span
              className="inline-flex items-center text-[9px] font-extrabold px-1 py-0.5 rounded shrink-0"
              style={{
                background: "color-mix(in srgb, var(--color-success) 20%, var(--color-card))",
                color: "var(--color-success)",
                border: "1px solid color-mix(in srgb, var(--color-success) 25%, transparent)",
              }}
            >
              +{delta} XP
            </span>
          )}
        </div>

        {/* Reward Chip */}
        {isCitizenEntry(entry) && (
          <div
            className={`mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border shadow-sm ${cfg.rewardBg}`}
          >
            <Gift size={9} className="shrink-0" style={{ color: cfg.giftIconColor }} />
            +{cfg.reward} XP
          </div>
        )}
      </div>

      {/* Podium block */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{
          type: "spring",
          stiffness: 180,
          damping: 26,
          delay: cfg.animationOrder * 0.08 + 0.12,
        }}
        style={{ transformOrigin: "bottom" }}
        className={`w-full rounded-t-2xl mt-2 relative border-t border-x overflow-hidden ${cfg.podiumHeight} ${cfg.podiumBorder} shadow-[0_-4px_12px_rgba(0,0,0,0.01)]`}
      >
        <div className={`absolute inset-0 bg-gradient-to-b ${cfg.podiumGradient}`} />

        {/* Shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,_var(--color-card)_15%,_transparent)] to-transparent opacity-50 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

        {/* Large translucent rank number */}
        <span
          className="absolute inset-0 flex items-center justify-center font-extrabold text-3xl sm:text-4xl opacity-20 select-none leading-none mt-1"
          style={{ color: cfg.numberColor }}
        >
          {cfg.place}
        </span>
      </motion.div>
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

  // Visual render order: 2nd (left) | 1st (center) | 3rd (right)
  // FIX: renamed loop variable from `dataIdx` → `visualSlot` to avoid confusion;
  //      the array values [1, 0, 2] are the actual dataIdx values into topThree/MEDAL_CONFIGS
  const VISUAL_ORDER = [1, 0, 2] as const;

  return (
    <div
      ref={containerRef}
      className="bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden"
      aria-label="Top 3 leaderboard"
    >
      <div
        className="relative px-1 sm:px-6 pt-14 pb-0"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--color-info) 15%, var(--color-card)) 0%, var(--color-card) 100%)",
        }}
      >
        {/* Radial brand glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 pointer-events-none opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(37,99,235,0.08) 0%, transparent 80%)",
          }}
          aria-hidden="true"
        />

        <FloatingStars />

        {/* Podium columns: 2nd | 1st | 3rd */}
        <div className="relative flex items-end justify-center gap-1 sm:gap-6 md:gap-8 max-w-2xl mx-auto z-10">
          {VISUAL_ORDER.map((dataIdx) => {
            const entry = topThree[dataIdx];
            const cfg = MEDAL_CONFIGS[dataIdx];
            if (!entry || !cfg) return null;
            return (
              <PodiumCard
                // FIX: key on place (stable) rather than array-position index
                key={cfg.place}
                entry={entry}
                cfg={cfg}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom strip */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,_var(--color-border)_12%,_var(--color-card))]">
        <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-text-secondary)]">
          Showing Top {visibleCount} of {totalCount}
        </span>

        {showHighlightMe && (
          <button
            onClick={onHighlightMe}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all duration-200"
            style={{
              border: "1px solid var(--color-border)",
              background: "color-mix(in srgb, var(--color-border) 10%, var(--color-card))",
              color: "var(--color-text-secondary)",
            }}
            aria-label="Scroll to and highlight my rank"
          >
            ★ Highlight Me
          </button>
        )}
      </div>
    </div>
  );
}
