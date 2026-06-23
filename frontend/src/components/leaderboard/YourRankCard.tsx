"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Trophy, ArrowUpRight } from "lucide-react";
import type { RankProgress } from "@/types/leaderboard";

// ─── YourRankCard ─────────────────────────────────────────────────────────────

interface YourRankCardProps {
  progress: RankProgress;
}

export function YourRankCard({ progress }: YourRankCardProps) {
  const router = useRouter();
  const pct = Math.min(100, Math.round((progress.currentXP / progress.nextRankXP) * 100));
  const remaining = progress.nextRankXP - progress.currentXP;

  return (
    <div className="neu-card-lg rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "color-mix(in srgb, var(--color-amber) 14%, transparent)" }}
        >
          <Trophy size={16} style={{ color: "var(--color-amber)" }} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
          Your Rank
        </h3>
      </div>

      {/* Current rank badge */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0"
          style={{
            background: `color-mix(in srgb, ${progress.badgeColor} 18%, transparent)`,
            border: `2px solid ${progress.badgeColor}`,
            color: progress.badgeColor,
          }}
          aria-hidden="true"
        >
          🛡
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--color-text-muted)" }}>
            Current Rank
          </p>
          <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            {progress.currentRank}
          </p>
          <p className="text-xs font-mono" style={{ color: "var(--color-amber)" }}>
            {progress.currentXP.toLocaleString()} XP
          </p>
        </div>
      </div>

      {/* XP bar */}
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          <span>Progress to <span className="font-semibold" style={{ color: "var(--color-text-secondary)" }}>{progress.nextRank}</span></span>
          <span className="font-mono">{pct}%</span>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: "var(--color-border)" }}
          role="progressbar"
          aria-valuenow={progress.currentXP}
          aria-valuemin={0}
          aria-valuemax={progress.nextRankXP}
          aria-label={`${pct}% to ${progress.nextRank}`}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, var(--color-amber), #F97316)" }}
          />
        </div>
        <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          <span className="font-mono font-semibold" style={{ color: "var(--color-text-secondary)" }}>
            {remaining.toLocaleString()} XP
          </span>{" "}
          to next rank
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push("/dashboard/achievements")}
        className="btn-outline w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
        aria-label="View achievements"
      >
        View Achievements
        <ArrowUpRight size={13} aria-hidden="true" />
      </button>
    </div>
  );
}
