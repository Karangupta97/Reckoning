"use client";

import { useEffect, useRef, useState } from "react";
import { Globe2, ArrowUpRight } from "lucide-react";
import type { GlobalStats } from "@/types/leaderboard";

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: string, duration = 1200): string {
  const [display, setDisplay] = useState("0");
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Parse target: strip non-numeric suffixes like "M+", "k", ","
    const suffix = target.replace(/[\d,. ]/g, "");
    const numeric = parseFloat(target.replace(/[^0-9.]/g, ""));
    if (isNaN(numeric)) { setDisplay(target); return; }

    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = numeric * eased;

      // Format with commas if original had them
      const formatted = target.includes(",")
        ? Math.floor(val).toLocaleString()
        : val >= 1_000_000
          ? (val / 1_000_000).toFixed(1) + "M"
          : Math.floor(val).toString();

      setDisplay(formatted + (progress < 1 ? "" : suffix));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

// ─── StatRow ──────────────────────────────────────────────────────────────────

function StatRow({
  label,
  rawValue,
  colorVar,
}: {
  label: string;
  rawValue: string;
  colorVar: string;
}) {
  const animated = useCountUp(rawValue);

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: colorVar }}
          aria-hidden="true"
        />
        <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          {label}
        </span>
      </div>
      <span
        className="text-sm font-black tabular-nums font-mono"
        style={{ color: "var(--color-amber)" }}
        aria-label={`${label}: ${rawValue}`}
      >
        {animated}
      </span>
    </div>
  );
}

// ─── GlobalImpactCard ─────────────────────────────────────────────────────────

interface GlobalImpactCardProps {
  stats: GlobalStats;
}

const STAT_ROWS = [
  { label: "Citizens Active", key: "citizensActive" as const, colorVar: "var(--color-info)" },
  { label: "Reports Submitted", key: "reportsSubmitted" as const, colorVar: "var(--color-success)" },
  { label: "Hazards Resolved", key: "hazardsResolved" as const, colorVar: "var(--color-amber)" },
  { label: "Lives Impacted", key: "livesImpacted" as const, colorVar: "var(--color-danger)" },
];

export function GlobalImpactCard({ stats }: GlobalImpactCardProps) {
  return (
    <div className="neu-card-lg rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "color-mix(in srgb, var(--color-amber) 14%, transparent)" }}
        >
          <Globe2 size={16} style={{ color: "var(--color-amber)" }} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
          Global Impact
        </h3>
      </div>

      {/* Stat rows */}
      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {STAT_ROWS.map((row) => (
          <StatRow
            key={row.key}
            label={row.label}
            rawValue={stats[row.key]}
            colorVar={row.colorVar}
          />
        ))}
      </div>

      {/* CTA */}
      <button
        className="btn-outline w-full mt-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
        aria-label="View full impact report"
      >
        View Full Impact
        <ArrowUpRight size={13} aria-hidden="true" />
      </button>
    </div>
  );
}
