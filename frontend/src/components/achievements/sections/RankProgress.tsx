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
      colorClass: "text-green-600",
      badgeBg: "bg-[#E8F8EE] text-[#10B981]",
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
      colorClass: "text-[#3B82F6]",
      badgeBg: "bg-[#E0F2FE] text-[#0284C7]",
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
      colorClass: "text-[#64748B]",
      badgeBg: "bg-[#F1F5F9] text-[#64748B]",
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
      colorClass: "text-[#64748B]",
      badgeBg: "bg-[#F1F5F9] text-[#64748B]",
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-4 sm:p-5 flex flex-col gap-5 w-full max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="text-center">
        <h3 className="text-xl md:text-2xl font-extrabold text-[#0F172A] flex items-center justify-center gap-1.5 tracking-tight">
          <span className="text-[#3B82F6] text-lg md:text-xl select-none">✦</span>
          Your Rank Progress
          <span className="text-[#3B82F6] text-lg md:text-xl select-none">✦</span>
        </h3>
        <p className="text-xs md:text-sm text-[#64748B] mt-1 font-medium">
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
                      <div className="absolute left-0 w-1/2 h-[3.5px] bg-[#22C55E] top-[40px] z-0" />
                      <div className="absolute left-0 top-[40px] -translate-y-1/2 w-2 h-2 rounded-full bg-[#22C55E] z-10" />
                    </>
                  )}

                  {/* Connecting lines between nodes (scales dynamically with column width) */}
                  {!isLast && (
                    <>
                      <div
                        className={`absolute left-1/2 w-full h-[3.5px] top-[40px] z-0 ${
                          rank.level === 1
                            ? "bg-gradient-to-r from-[#22C55E] to-[#3B82F6]"
                            : "bg-[#E2E8F0]"
                        }`}
                      />
                      {/* Intermediate Dot Circle placed exactly centered between this node and the next */}
                      <div
                        className={`absolute left-[100%] -translate-x-1/2 top-[40px] -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center z-10 shadow-sm ${
                          rank.level === 1 ? "border-[#3B82F6]" : "border-[#CBD5E1]"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            rank.level === 1 ? "bg-[#3B82F6]" : "bg-[#CBD5E1]"
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
                    <div className="absolute w-14 h-14 rounded-full bg-white z-0" />

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
                      rank.isActive ? "text-[#3B82F6]" : "text-[#475569]"
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
                  <span className="text-[10px] font-medium text-[#94A3B8] text-center tracking-wider uppercase">
                    {rank.xpRange}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Next Rank Premium Card (Visible on all viewports, optimized for mobile) ── */}
      <div className="mt-1 bg-[#F5F3FF] border border-[#E9E3FF] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between hover:bg-[#F3E8FF] transition-all duration-300 group cursor-pointer shadow-[0_2px_8px_rgba(124,58,237,0.02)]">
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Lavender logo emblem */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0 border border-[#DDD6FE] shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
            <span className="text-[11px] sm:text-xs font-medium text-[#64748B]">Next rank</span>
            <span className="text-[11px] sm:text-xs font-bold text-[#7C3AED]">Community Sentinel</span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <span className="text-[11px] sm:text-xs font-semibold text-[#64748B]">
            {xpToNext.toLocaleString()} XP needed
          </span>
          <ChevronRight size={13} className="text-[#7C3AED] group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </div>
  );
}
