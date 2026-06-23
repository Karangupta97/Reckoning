"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import Image from "next/image";
import { BADGES } from "../mockData";

type Rarity = "common" | "rare" | "epic" | "legendary";

const RARITY_CLASSES: Record<Rarity, { card: string; badge: string; dot: string }> = {
  common: {
    card: "bg-[#F0FDF4] border-[#BBF7D0] hover:shadow-[0_8px_30px_rgba(34,197,94,0.04)]",
    badge: "bg-[#E8F8EE] text-[#10B981] border-[#BBF7D0]",
    dot: "bg-[#22C55E]",
  },
  rare: {
    card: "bg-[#F0F9FF] border-[#BFDBFE] hover:shadow-[0_8px_30px_rgba(59,130,246,0.04)]",
    badge: "bg-[#E0F2FE] text-[#0284C7] border-[#BFDBFE]",
    dot: "bg-[#22C55E]",
  },
  epic: {
    card: "bg-[#FAF5FF] border-[#E9D5FF] hover:shadow-[0_8px_30px_rgba(139,92,246,0.04)]",
    badge: "bg-[#F3E8FF] text-[#7C3AED] border-[#E9D5FF]",
    dot: "bg-[#22C55E]",
  },
  legendary: {
    card: "bg-[#FFFBEB] border-[#FDE68A] hover:shadow-[0_8px_30px_rgba(245,158,11,0.04)]",
    badge: "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]",
    dot: "bg-[#F97316]",
  },
};

function SignalGuardianSvg({ locked, size = 48 }: { locked: boolean; size?: number }) {
  const color1 = locked ? "#94A3B8" : "#3B82F6";
  const color2 = locked ? "#475569" : "#1D4ED8";
  
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={locked ? "grayscale opacity-50" : ""}>
      <defs>
        <linearGradient id="shieldGradSignal" x1="60" y1="15" x2="60" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
        <linearGradient id="bevelGradSignal" x1="60" y1="19" x2="60" y2="101" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path d="M 60 15 L 99 37.5 V 82.5 L 60 105 L 21 82.5 V 37.5 Z" fill="url(#shieldGradSignal)" />
      <path d="M 60 19 L 95.5 39.5 V 80.5 L 60 101 L 24.5 80.5 V 39.5 Z" fill="url(#bevelGradSignal)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <g stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 45 42 A 18 18 0 0 1 75 42" />
        <path d="M 37 34 A 28 28 0 0 1 83 34" />
        <path d="M 60 48 V 78" />
        <path d="M 48 82 H 72" />
        <path d="M 50 82 L 60 62 L 70 82" />
        <circle cx="60" cy="46" r="3" fill="white" stroke="none" />
      </g>
    </svg>
  );
}

function TopContributorSvg({ locked, size = 48 }: { locked: boolean; size?: number }) {
  const color1 = locked ? "#94A3B8" : "#F59E0B";
  const color2 = locked ? "#475569" : "#B45309";
  
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={locked ? "grayscale opacity-50" : ""}>
      <defs>
        <linearGradient id="shieldGradTop" x1="60" y1="15" x2="60" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
        <linearGradient id="bevelGradTop" x1="60" y1="19" x2="60" y2="101" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path d="M 60 15 L 99 37.5 V 82.5 L 60 105 L 21 82.5 V 37.5 Z" fill="url(#shieldGradTop)" />
      <path d="M 60 19 L 95.5 39.5 V 80.5 L 60 101 L 24.5 80.5 V 39.5 Z" fill="url(#bevelGradTop)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      <g fill="white">
        <path d="M 52 64 L 46 88 L 60 80 L 74 88 L 68 64 Z" opacity="0.9" />
        <path d="M 60 30 L 66.5 43.5 L 81 45.5 L 70.5 55.5 L 73 70 L 60 63 L 47 70 L 49.5 55.5 L 39 45.5 L 53.5 43.5 Z" />
      </g>
      <g stroke={locked ? "#94A3B8" : "#FBBF24"} strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M 12 70 Q 8 92 36 102" />
        <path d="M 108 70 Q 112 92 84 102" />
        <path d="M 10 74 Q 5 76 8 82" />
        <path d="M 12 84 Q 7 88 12 94" />
        <path d="M 110 74 Q 115 76 112 82" />
        <path d="M 108 84 Q 113 88 108 94" />
      </g>
    </svg>
  );
}

export function BadgesCollection() {
  const unlockedCount = BADGES.filter((b) => b.unlocked).length;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-4 sm:p-5 flex flex-col gap-5 w-full max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h3 className="text-lg md:text-xl font-extrabold text-[#0F172A] flex items-center gap-1.5 tracking-tight">
            <span className="text-[#3B82F6] text-base md:text-lg select-none">✦</span>
            Badges Collection
            <span className="text-[#3B82F6] text-base md:text-lg select-none">✦</span>
          </h3>
          <p className="text-[11px] md:text-xs text-[#64748B] mt-0.5 font-medium">
            Collect badges by reporting, verifying and contributing to your community safety.
          </p>
        </div>

        {/* 4/8 unlocked pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] self-start sm:self-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
          <span className="text-[10px] font-bold text-[#16A34A]">{unlockedCount}/8 unlocked</span>
        </div>
      </div>

      {/* ── 3-column badge grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {BADGES.map((badge, i) => {
          const rarity = badge.rarity as Rarity;
          const styles = RARITY_CLASSES[rarity];

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.32, delay: i * 0.04 }}
              className={`relative flex flex-col items-center text-center rounded-xl p-2.5 sm:p-3 border transition-all duration-300 hover:scale-[1.02] ${
                badge.unlocked ? styles.card : "bg-[#F8FAFC] border-[#E2E8F0] shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
              }`}
            >
              {/* Top Right Dot/Lock Status */}
              {badge.unlocked ? (
                <span className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full ${styles.dot}`} />
              ) : (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#E2E8F0]/80 border border-[#CBD5E1] flex items-center justify-center shadow-sm">
                  <Lock size={8} className="text-[#64748B]" />
                </div>
              )}

              {/* Emblem icon area */}
              <div className="w-12 h-12 flex items-center justify-center mb-1.5">
                {badge.id === "b7" ? (
                  <SignalGuardianSvg locked={!badge.unlocked} size={48} />
                ) : badge.id === "b8" ? (
                  <TopContributorSvg locked={!badge.unlocked} size={48} />
                ) : (
                  <Image
                    src={`/images/badge-${badge.name.toLowerCase().replace(/\s+/g, "-")}.png`}
                    alt={badge.name}
                    width={48}
                    height={48}
                    className={`object-contain filter contrast-[1.12] brightness-[1.04] ${
                      !badge.unlocked ? "grayscale opacity-50" : ""
                    }`}
                    style={{ mixBlendMode: "multiply" }}
                    priority
                  />
                )}
              </div>

              {/* Title */}
              <span
                className={`text-[11px] sm:text-xs font-bold tracking-tight mb-1 ${
                  badge.unlocked ? "text-[#0F172A]" : "text-[#64748B]"
                }`}
              >
                {badge.name}
              </span>

              {/* Rarity Capsule */}
              <span
                className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  badge.unlocked ? styles.badge : "bg-[#E2E8F0]/50 text-[#64748B] border-[#E2E8F0]"
                }`}
              >
                {badge.rarity}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* ── Bottom Information Card ── */}
      <div className="bg-[#F0F5FF] border border-[#E0EAFF] rounded-2xl p-2.5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#E0EAFF] text-[#3B82F6] flex items-center justify-center shrink-0 border border-[#D0DFFF] shadow-sm">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="flex flex-col gap-0.5 text-left">
          <span className="text-xs font-bold text-[#0F172A]">Every badge earned makes a difference.</span>
          <span className="text-[10px] text-[#64748B]">Your actions help build a safer community for everyone.</span>
        </div>
      </div>
    </div>
  );
}
