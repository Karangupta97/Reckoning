"use client";

import { motion } from "framer-motion";
import { Zap, Clock, ArrowUpRight } from "lucide-react";
import type { Challenge } from "@/types/leaderboard";

// ─── ChallengeRow ─────────────────────────────────────────────────────────────

function ChallengeRow({ ch, index }: { ch: Challenge; index: number }) {
  const pct = Math.min(100, Math.round((ch.progress / ch.total) * 100));

  return (
    <div className="space-y-1.5">
      {/* Title + reward */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold leading-tight" style={{ color: "var(--color-text-primary)" }}>
          {ch.title}
        </span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{
            background: "color-mix(in srgb, var(--color-amber) 15%, transparent)",
            color: "var(--color-amber)",
          }}
        >
          +{ch.reward} XP
        </span>
      </div>

      {/* Progress fraction + deadline */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono" style={{ color: "var(--color-text-secondary)" }}>
          {ch.progress}/{ch.total}
        </span>
        <span
          className="flex items-center gap-1 text-[10px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          <Clock size={9} aria-hidden="true" />
          {ch.endsAt}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--color-border)" }}
        role="progressbar"
        aria-valuenow={ch.progress}
        aria-valuemin={0}
        aria-valuemax={ch.total}
        aria-label={`${ch.title}: ${ch.progress} of ${ch.total}`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: index * 0.15, ease: [0.4, 0, 0.2, 1] }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, var(--color-amber), #F97316)" }}
        />
      </div>
    </div>
  );
}

// ─── ChallengesCard ───────────────────────────────────────────────────────────

interface ChallengesCardProps {
  challenges: Challenge[];
}

export function ChallengesCard({ challenges }: ChallengesCardProps) {
  return (
    <div className="neu-card-lg rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "color-mix(in srgb, var(--color-amber) 14%, transparent)" }}
        >
          <Zap size={16} style={{ color: "var(--color-amber)" }} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
          Current Challenges
        </h3>
      </div>

      {/* Challenge list */}
      <div className="space-y-4">
        {challenges.map((ch, i) => (
          <ChallengeRow key={ch.id} ch={ch} index={i} />
        ))}
      </div>
    </div>
  );
}
