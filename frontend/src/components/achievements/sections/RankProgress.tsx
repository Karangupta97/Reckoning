"use client";
"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { USER_PROFILE } from "../mockData";

export function RankProgress() {
  const currentXP = USER_PROFILE.totalXP;            // 2450
  const nextRankXP = USER_PROFILE.nextRankXP;        // 3000
  const xpToNext = nextRankXP - currentXP;           // 550

  const ranks = [
    {
      level: 1,
      title: "Citizen",
      levelText: "Lv. 1",
      xpRange: "0 – 999 XP",
      image: "/images/rank-citizen.png",
      isActive: false,
      isCompleted: true,
      isFuture: false,
      colorClass: "text-[var(--color-success)]",
      badgeBg: "bg-[color-mix(in_srgb,_var(--color-success)_18%,_var(--color-card))] text-[var(--color-success)] border-[color-mix(in_srgb,_var(--color-success)_30%,_var(--color-card))]",
    },
    {
      level: 2,
      title: "Road Guardian",
      levelText: "Lv. 2",
      xpRange: "1K – 2.999K XP",
      image: "/images/rank-road-guardian.png",
      isActive: true,
      isCompleted: false,
      isFuture: false,
      colorClass: "text-[var(--color-info)]",
      badgeBg: "bg-[color-mix(in_srgb,_var(--color-info)_18%,_var(--color-card))] text-[var(--color-info)] border-[color-mix(in_srgb,_var(--color-info)_30%,_var(--color-card))]",
    },
    {
      level: 3,
      title: "Community Sentinel",
      levelText: "Lv. 3",
      xpRange: "3K – 6.999K XP",
      image: "/images/rank-community-sentinel.png",
      isActive: false,
      isCompleted: false,
      isFuture: true,
      colorClass: "text-[var(--color-text-secondary)]",
      badgeBg: "bg-[color-mix(in_srgb,_var(--color-border)_20%,_var(--color-card))] text-[var(--color-text-secondary)] border-[var(--color-border)]",
    },
    {
      level: 4,
      title: "Road Warrior",
      levelText: "Lv. 4",
      xpRange: "7K+ XP",
      image: "/images/rank-road-warrior.png",
      isActive: false,
      isCompleted: false,
      isFuture: true,
      colorClass: "text-[var(--color-text-secondary)]",
      badgeBg: "bg-[color-mix(in_srgb,_var(--color-border)_20%,_var(--color-card))] text-[var(--color-text-secondary)] border-[var(--color-border)]",
    },
  ];

  return (
    <div className="neu-card p-4 sm:p-5 flex flex-col gap-5 w-full max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="text-center">
        <h3 className="text-xl md:text-2xl font-extrabold text-[var(--color-text-primary)] flex items-center justify-center gap-1.5 tracking-tight">
          <span className="text-[var(--color-info)] text-lg md:text-xl select-none">✦</span>
          Your Rank Progress
          <span className="text-[var(--color-info)] text-lg md:text-xl select-none">✦</span>
        </h3>
        <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1 font-medium">
          Keep contributing. Every action makes your community safer.
        </p>
      </div>

      {/* ── Rank Progress Timeline Container (Horizontal Scrollable on Mobile) ── */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-none">
        <div className="relative min-w-[700px] md:min-w-0 px-2 py-2">
          {/* Ranks flex row */}
          <div className="flex items-start justify-between relative">
            {ranks.map((rank, idx) => {
              const isLast = idx === ranks.length - 1;
              const isFirst = idx === 0;

              return (
                <div key={rank.level} className="flex flex-col items-center gap-2 w-1/4 shrink-0 relative">
                  {/* Left extension line for the first node */}
                  {isFirst && (
                    <>
                      <div className="absolute left-0 w-1/2 h-[3.5px] bg-[var(--color-success)] top-[40px] z-0" />
                      <div className="absolute left-0 top-[40px] -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--color-success)] z-10" />
                    </>
                  )}

                  {/* Connecting lines between nodes (scales dynamically with column width) */}
                  {!isLast && (
                    <>
                      <div
                        className={`absolute left-1/2 w-full h-[3.5px] top-[40px] z-0 ${
                          rank.level === 1
                            ? "bg-gradient-to-r from-[var(--color-success)] to-[var(--color-info)]"
                            : "bg-[var(--color-border)]"
                        }`}
                      />
                      {/* Intermediate Dot Circle placed exactly centered between this node and the next */}
                      <div
                        className={`absolute left-[100%] -translate-x-1/2 top-[40px] -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 bg-[var(--color-card)] flex items-center justify-center z-10 shadow-sm ${
                          rank.level === 1 ? "border-[var(--color-info)]" : "border-[var(--color-border)]"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            rank.level === 1 ? "bg-[var(--color-info)]" : "bg-[var(--color-border)]"
                          }`}
                        />
                      </div>
                    </>
                  )}

                  {/* Right extension line for the last node */}
                  {isLast && (
                    <>
                      <div className="absolute left-1/2 w-1/2 h-[3.5px] bg-[#E2E8F0] top-[40px] z-0" />
                      <div className="absolute left-[100%] top-[40px] -translate-y-1/2 w-2 h-2 rounded-full bg-[#CBD5E1] z-10" />
                    </>
                  )}

                  {/* Rank Emblem with dynamic states */}
                  <div className="relative w-20 h-20 flex items-center justify-center z-10">
                    {/* Solid white circular background to mask the timeline line (no shadow/border so it blends invisibly with card background) */}
                    <div className="absolute w-14 h-14 rounded-full bg-[var(--color-card)] z-0" />

                    {/* Active glow / background ring */}
                    {rank.isActive && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-blue-100/30 blur-lg scale-110 animate-pulse z-0" />
                        <div className="absolute inset-0 rounded-full border border-blue-400/20 scale-105 z-0" />
                      </>
                    )}
                    <motion.div
                      whileHover={{ scale: 1.04 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className={`relative z-10 w-16 h-16 transition-all duration-300 ${
                        rank.isFuture ? "filter grayscale opacity-45 hover:grayscale-0 hover:opacity-85" : ""
                      }`}
                      style={{ mixBlendMode: "multiply" }}
                    >
                      <Image
                        src={rank.image}
                        alt={rank.title}
                        width={64}
                        height={64}
                        className="object-contain filter contrast-[1.12] brightness-[1.04]"
                        style={{ mixBlendMode: "multiply" }}
                        priority
                      />
                    </motion.div>
                  </div>

                  {/* Title */}
                  <span
                    className={`text-xs font-bold text-center tracking-tight ${
                      rank.isActive ? "text-[var(--color-info)]" : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {rank.title}
                  </span>

                  {/* Level Badge */}
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm tracking-wide ${rank.badgeBg}`}
                  >
                    {rank.levelText}
                  </span>

                  {/* XP Range */}
                  <span className="text-[10px] font-medium text-[var(--color-text-muted)] text-center tracking-wider uppercase">
                    {rank.xpRange}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Next Rank Premium Card (Visible on all viewports, optimized for mobile) ── */}
      <div
        className="mt-1 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between transition-all duration-300 group cursor-pointer shadow-[0_2px_8px_rgba(124,58,237,0.02)]"
        style={{
          background: "color-mix(in srgb, var(--color-info) 8%, var(--color-card))",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Lavender logo emblem */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[color-mix(in_srgb,_var(--color-info)_12%,_var(--color-card))] text-[var(--color-info)] flex items-center justify-center shrink-0 border border-[var(--color-border)] shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
            <span className="text-[11px] sm:text-xs font-medium text-[var(--color-text-secondary)]">Next rank</span>
            <span className="text-[11px] sm:text-xs font-bold text-[var(--color-info)]">Community Sentinel</span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-text-secondary)]">
            {xpToNext.toLocaleString()} XP needed
          </span>
          <ChevronRight size={13} className="text-[var(--color-info)] group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </div>
  );
}
