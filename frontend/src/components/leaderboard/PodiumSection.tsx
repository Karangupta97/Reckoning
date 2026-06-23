"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Gift, BadgeCheck } from "lucide-react";
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

// ─── Laurel Wreath SVG ───
// Thin, refined, symmetrical laurel branches wrapping 60-70% around the avatar ring with clean spacing.
function LaurelWreath({ color, className = "" }: { color: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      className={`absolute -bottom-4.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-90 z-0 ${className}`}
    >
      {/* Left branch stem */}
      <path
        d="M 38 82 C 18 76, 12 50, 24 24"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Right branch stem */}
      <path
        d="M 82 82 C 102 76, 108 50, 96 24"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      
      {/* Symmetrical Left Leaves - thinner and refined */}
      <path d="M 34 76 C 29 73, 28 68, 33 66 C 36 68, 36 73, 34 76" fill={color} />
      <path d="M 27 64 C 21 61, 22 56, 27 54 C 30 56, 29 61, 27 64" fill={color} />
      <path d="M 22 50 C 16 47, 18 42, 23 40 C 26 42, 25 47, 22 50" fill={color} />
      <path d="M 20 36 C 15 32, 18 27, 23 26 C 26 28, 24 33, 20 36" fill={color} />
      <path d="M 23 22 C 20 17, 24 13, 28 13 C 30 17, 27 21, 23 22" fill={color} />

      {/* Symmetrical Right Leaves */}
      <path d="M 86 76 C 91 73, 92 68, 87 66 C 84 68, 84 73, 86 76" fill={color} />
      <path d="M 93 64 C 99 61, 98 56, 93 54 C 90 56, 91 61, 93 64" fill={color} />
      <path d="M 98 50 C 104 47, 102 42, 97 40 C 94 42, 95 47, 98 50" fill={color} />
      <path d="M 100 36 C 105 32, 102 27, 97 26 C 94 28, 96 33, 100 36" fill={color} />
      <path d="M 97 22 C 100 17, 96 13, 92 13 C 90 17, 93 21, 97 22" fill={color} />
    </svg>
  );
}

// ─── Animated Floating Crown ───
function PremiumCrown() {
  return (
    <motion.div
      initial={{ y: -5, opacity: 0 }}
      animate={{ y: [0, -4, 0], opacity: 1 }}
      transition={{
        y: {
          repeat: Infinity,
          duration: 3.5,
          ease: "easeInOut",
        },
        opacity: { duration: 0.3 }
      }}
      className="absolute -top-13.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none drop-shadow-[0_3px_6px_rgba(245,158,11,0.4)] scale-90 sm:scale-100"
    >
      <svg width="34" height="28" viewBox="0 0 34 26" fill="none">
        <path
          d="M 3 22 L 5 8 L 12 14 L 17 4 L 22 14 L 29 8 L 31 22 Z"
          fill="url(#goldCrownGrad)"
          stroke="#B45309"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="17" cy="4" r="1.5" fill="#FEF3C7" stroke="#B45309" strokeWidth="1" />
        <circle cx="5" cy="8" r="1" fill="#FEF3C7" stroke="#B45309" strokeWidth="1" />
        <circle cx="29" cy="8" r="1" fill="#FEF3C7" stroke="#B45309" strokeWidth="1" />
        <rect x="7" y="19" width="20" height="2" rx="1" fill="#B45309" />
        <defs>
          <linearGradient id="goldCrownGrad" x1="17" y1="4" x2="17" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

// ─── Premium Medal with Ribbons ───
function PremiumMedal({ rank }: { rank: 1 | 2 | 3 }) {
  const config = {
    1: {
      bg: "url(#goldMedalGrad)",
      border: "#D97706",
      ribbon: "#EF4444",
      text: "#78350F",
    },
    2: {
      bg: "url(#silverMedalGrad)",
      border: "#64748B",
      ribbon: "#94A3B8",
      text: "#1E293B",
    },
    3: {
      bg: "url(#bronzeMedalGrad)",
      border: "#9A3412",
      ribbon: "#C97A3D",
      text: "#7C2D12",
    },
  }[rank];

  return (
    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-md scale-90 sm:scale-100">
      <svg width="28" height="34" viewBox="0 0 32 38" fill="none">
        {/* Ribbon Tails */}
        <path d="M 11 16 L 7 34 L 12 30 L 16 34 L 14 16" fill={config.ribbon} opacity="0.95" />
        <path d="M 21 16 L 25 34 L 20 30 L 16 34 L 18 16" fill={config.ribbon} opacity="0.95" />
        {/* Medal Circle */}
        <circle cx="16" cy="16" r="12" fill={config.bg} stroke={config.border} strokeWidth="1.5" />
        <circle cx="16" cy="16" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 1" />
        {/* Number */}
        <text x="16" y="20" textAnchor="middle" fill={config.text} fontSize="11" fontWeight="900" fontFamily="sans-serif">
          {rank}
        </text>
        <defs>
          <linearGradient id="goldMedalGrad" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
          <linearGradient id="silverMedalGrad" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="bronzeMedalGrad" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFEDD5" />
            <stop offset="100%" stopColor="#C97A3D" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── Symmetrical leaf decorations inside podium blocks ───
function PodiumStepLaurel({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 40" fill="none" className="w-12 h-5 opacity-25 pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2">
      <path d="M 28 24 C 18 20, 18 10, 26 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 72 24 C 82 20, 82 10, 74 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="14" r="1.5" fill={color} />
      <circle cx="76" cy="14" r="1.5" fill={color} />
    </svg>
  );
}

// ─── Star Particles background ───
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
          className="absolute text-[#FBBF24]/20 text-[9px] sm:text-[11px]"
          style={{ top: p.top, left: p.left }}
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

// ─── Medal configs ────────────────────────────────────────────────────────────

const MEDAL_CONFIGS = [
  {
    place: 1,
    ringColor: "border-[#F59E0B]",
    glow: "rgba(245,158,11,0.15)",
    wreathColor: "#F59E0B",
    avatarCls: "w-[72px] h-[72px] sm:w-[96px] sm:h-[96px] border-[5px]",
    wreathSize: "w-26 h-22 sm:w-36 sm:h-32",
    nameCls: "text-xs sm:text-base font-extrabold",
    pointsCls: "text-[#D97706] text-xs sm:text-base font-extrabold",
    podiumHeight: "h-16 sm:h-20",
    podiumGradient: "from-[#FEF3C7] via-[#FBBF24]/50 to-[#F59E0B]/15",
    podiumBorder: "border-[#F59E0B]/40",
    reward: "1,000",
    rewardBg: "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]",
    giftIconColor: "#D97706",
    order: 1,
    dataIdx: 0,
  },
  {
    place: 2,
    ringColor: "border-[#94A3B8]",
    glow: "rgba(148,163,184,0.12)",
    wreathColor: "#94A3B8",
    avatarCls: "w-14 h-14 sm:w-20 sm:h-20 border-[4px]",
    wreathSize: "w-22 h-18 sm:w-30 sm:h-26",
    nameCls: "text-xs sm:text-sm font-bold",
    pointsCls: "text-[#475569] text-xs sm:text-sm font-extrabold",
    podiumHeight: "h-11 sm:h-14",
    podiumGradient: "from-[#F1F5F9] via-[#CBD5E1]/50 to-[#94A3B8]/15",
    podiumBorder: "border-[#94A3B8]/30",
    reward: "500",
    rewardBg: "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]",
    giftIconColor: "#475569",
    order: 0,
    dataIdx: 1,
  },
  {
    place: 3,
    ringColor: "border-[#C97A3D]",
    glow: "rgba(201,122,61,0.12)",
    wreathColor: "#C97A3D",
    avatarCls: "w-14 h-14 sm:w-20 sm:h-20 border-[4px]",
    wreathSize: "w-22 h-18 sm:w-30 sm:h-26",
    nameCls: "text-xs sm:text-sm font-bold",
    pointsCls: "text-[#9A3412] text-xs sm:text-sm font-extrabold",
    podiumHeight: "h-8 sm:h-10",
    podiumGradient: "from-[#FFEDD5] via-[#FED7AA]/50 to-[#C97A3D]/15",
    podiumBorder: "border-[#C97A3D]/30",
    reward: "250",
    rewardBg: "bg-[#FED7AA]/20 text-[#9A3412] border-[#FED7AA]",
    giftIconColor: "#9A3412",
    order: 2,
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
  const isFirst = cfg.place === 1;
  const label = isCitizenEntry(entry)
    ? `${entry.points.toLocaleString()} XP`
    : `${entry.issuesResolved} solved`;
  const delta = isCitizenEntry(entry) ? entry.pointsDeltaWeek : entry.pointsDeltaWeek;

  return (
    <motion.button
      initial={{ opacity: 0, y: isFirst ? -10 : 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 24,
        delay: cfg.order * 0.08,
      }}
      onClick={() => onSelect(entry)}
      className="flex flex-col items-center flex-1 max-w-[125px] sm:max-w-[155px] focus:outline-none group relative"
      aria-label={`${cfg.place} place: ${entry.name} – ${label}`}
    >
      {/* Laurels & Glowing Background */}
      <div className="relative mb-0.5 flex items-center justify-center">
        {/* Crown above Medal/Avatar for 1st */}
        {isFirst && <PremiumCrown />}

        {/* Floating Rank Ribbon Medal */}
        <PremiumMedal rank={cfg.place} />
        
        {/* Laurel wreath behind profile ring */}
        <LaurelWreath color={cfg.wreathColor} className={cfg.wreathSize} />

        {/* Glow behind avatar */}
        <div
          className="absolute inset-0 rounded-full blur-lg opacity-35 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none"
          style={{ background: cfg.glow }}
        />

        {/* Profile Avatar Ring */}
        <div
          className={`relative ${cfg.avatarCls} rounded-full flex items-center justify-center font-black text-white flex-shrink-0 overflow-hidden z-10 transition-all duration-300 group-hover:scale-[1.04] bg-gray-200 ${cfg.ringColor}`}
          style={{
            boxShadow: `0 6px 16px ${cfg.glow}`,
          }}
        >
          {entry.avatarUrl ? (
            <img src={entry.avatarUrl} alt={entry.name} className="w-full h-full object-cover select-none" />
          ) : (
            <span className={isFirst ? "text-2xl" : "text-xl"}>{entry.initial}</span>
          )}
        </div>
      </div>

      {/* Profile Details */}
      <div className="text-center w-full z-10 px-0.5 mt-0.5">
        {/* Name */}
        <div className="flex items-center justify-center gap-1">
          <span
            className={`${cfg.nameCls} truncate max-w-[75px] sm:max-w-[115px] text-[#0F172A]`}
          >
            {entry.name.split(" ")[0]}
          </span>
          {isCitizenEntry(entry) && entry.isVerifiedUser && (
            <BadgeCheck size={13} className="text-[#3B82F6] shrink-0" aria-label="Verified" />
          )}
        </div>

        {/* XP Value & Gain badge row */}
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <span className={`${cfg.pointsCls} tabular-nums`}>
            {label.split(" ")[0]}
          </span>
          {isCitizenEntry(entry) && (
            <span className="inline-flex items-center text-[9px] font-extrabold px-1 py-0.5 rounded bg-green-50 text-green-600 border border-green-200 shrink-0">
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
        transition={{ type: "spring", stiffness: 180, damping: 26, delay: cfg.order * 0.08 + 0.12 }}
        style={{ transformOrigin: "bottom" }}
        className={`w-full rounded-t-2xl mt-2 relative border-t border-x overflow-hidden ${cfg.podiumHeight} ${cfg.podiumBorder} shadow-[0_-4px_12px_rgba(0,0,0,0.01)]`}
      >
        {/* Defined metallic background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b ${cfg.podiumGradient}`} />
        
        {/* Glass reflection shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-50 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

        {/* Laurels inside podium flanking the number */}
        <PodiumStepLaurel color={isFirst ? "#D97706" : cfg.place === 2 ? "#64748B" : "#C97A3D"} />

        {/* Large translucent number inside podium */}
        <span
          className="absolute inset-0 flex items-center justify-center font-extrabold text-3xl sm:text-4xl opacity-20 select-none leading-none mt-1"
          style={{ color: isFirst ? "#D97706" : cfg.place === 2 ? "#475569" : "#9A3412" }}
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

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden"
      aria-label="Top 3 leaderboard"
    >
      <div className="relative px-1 sm:px-6 pt-14 pb-0 bg-gradient-to-b from-[#F8FAFC]/50 to-white">
        {/* Radial brand glow centered at the top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 pointer-events-none opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(37,99,235,0.08) 0%, transparent 80%)",
          }}
          aria-hidden="true"
        />

        {/* Glowing stars particles */}
        <FloatingStars />

        {/* Podium columns: 2nd | 1st | 3rd */}
        <div className="relative flex items-end justify-center gap-1 sm:gap-6 md:gap-8 max-w-2xl mx-auto z-10">
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
        className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-t border-gray-100 bg-[#F8FAFC]/40"
      >
        <span className="text-[11px] sm:text-xs font-semibold text-[#64748B]">
          Showing Top {visibleCount} of {totalCount}
        </span>

        {showHighlightMe && (
          <button
            onClick={onHighlightMe}
            className="flex items-center gap-1 px-3 py-1 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full text-[10px] sm:text-xs font-bold text-[#475569] shadow-sm transition-all duration-200"
            aria-label="Scroll to and highlight my rank"
          >
            ★ Highlight Me
          </button>
        )}
      </div>
    </div>
  );
}
