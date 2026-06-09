"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { BADGES } from "../mockData";
import { Icon } from "../icons";
import type { Badge } from "../types";

const RARITY_COLORS: Record<Badge["rarity"], string> = {
  common:    "#22C55E",
  rare:      "#3B82F6",
  epic:      "#8B5CF6",
  legendary: "#F59E0B",
};

// Short subtitle shown below the badge name
const RARITY_LABELS: Record<Badge["rarity"], string> = {
  common:    "Common",
  rare:      "Rare",
  epic:      "Epic",
  legendary: "Legendary",
};

export function BadgesCollection() {
  const unlockedCount = BADGES.filter((b) => b.unlocked).length;

  return (
    <div className="neu-card p-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Badges Collection
        </h3>
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: "color-mix(in srgb, #22C55E 12%, transparent)",
            color: "#22C55E",
            border: "1px solid color-mix(in srgb, #22C55E 25%, transparent)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"
            style={{ boxShadow: "0 0 4px #22C55E" }}
          />
          {unlockedCount}/{BADGES.length} unlocked
        </span>
      </div>

      {/* ── 4-column badge grid ── */}
      <div className="grid grid-cols-4 gap-2">
        {BADGES.map((badge, i) => {
          const color = RARITY_COLORS[badge.rarity];
          const isLegendary = badge.rarity === "legendary";

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28, delay: i * 0.04 }}
              className="relative flex flex-col items-center text-center rounded-xl px-1.5 py-2.5 transition-all duration-200 hover:scale-[1.03]"
              style={{
                background: badge.unlocked
                  ? `color-mix(in srgb, ${color} 8%, transparent)`
                  : "var(--color-surface)",
                border: badge.unlocked
                  ? `1px solid color-mix(in srgb, ${color} 22%, transparent)`
                  : "1px solid var(--color-border)",
                opacity: badge.unlocked ? 1 : 0.55,
              }}
            >
              {/* Unlocked green dot indicator */}
              {badge.unlocked && (
                <span
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isLegendary ? color : "#22C55E",
                    boxShadow: `0 0 5px ${isLegendary ? color : "#22C55E"}`,
                  }}
                />
              )}

              {/* Icon circle */}
              <div
                className="relative w-10 h-10 rounded-full flex items-center justify-center mb-1.5"
                style={{
                  background: badge.unlocked
                    ? `color-mix(in srgb, ${color} 15%, transparent)`
                    : "var(--color-border)",
                  color: badge.unlocked ? color : "var(--color-text-muted)",
                  boxShadow: badge.unlocked
                    ? `0 0 10px color-mix(in srgb, ${color} 30%, transparent)`
                    : "none",
                }}
              >
                {badge.unlocked ? (
                  <Icon name={badge.icon} size={18} strokeWidth={2} />
                ) : (
                  <Lock size={14} strokeWidth={2.2} className="text-[var(--color-text-muted)]" />
                )}
              </div>

              {/* Name */}
              <span
                className="text-[10px] font-semibold leading-tight line-clamp-2"
                style={{
                  color: badge.unlocked
                    ? "var(--color-text-primary)"
                    : "var(--color-text-muted)",
                }}
              >
                {badge.name}
              </span>

              {/* Subtitle — rarity label */}
              <span
                className="mt-0.5 text-[9px] font-medium"
                style={{
                  color: badge.unlocked ? color : "var(--color-text-muted)",
                }}
              >
                {RARITY_LABELS[badge.rarity]}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
