"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { POINT_RULES } from "../mockData";

export function PointsBreakdown() {
  const [expanded, setExpanded] = useState(false);
  const visibleRules = expanded ? POINT_RULES : POINT_RULES.slice(0, 6);

  return (
    <div className="neu-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
          How to earn points
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-[var(--color-info)] hover:underline font-medium"
        >
          {expanded ? "Show less" : "See all"}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div className="space-y-2.5">
        {visibleRules.map((rule) => (
          <div
            key={rule.action}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-amber)] transition-colors duration-200"
          >
            <span className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium">
              {rule.action}
            </span>
            <span
              className="text-xs sm:text-sm font-bold tabular-nums"
              style={{
                color: rule.isNegative ? "var(--color-danger)" : "var(--color-success)",
              }}
            >
              {rule.isNegative ? "" : "+"}{rule.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
