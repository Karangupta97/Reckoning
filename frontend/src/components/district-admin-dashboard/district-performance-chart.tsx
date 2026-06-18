"use client";

import React from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useIsClient } from "@/hooks/useIsClient";

const data = [
  { sub: "Mehrauli", score: 88 },
  { sub: "Vasant Kunj", score: 74 },
  { sub: "Dwarka", score: 91 },
  { sub: "Rohini", score: 62 },
  { sub: "Shahdara", score: 79 },
  { sub: "Najafgarh", score: 55 },
];

function getBarColor(score: number) {
  if (score >= 85) return "#14b8a6"; // teal
  if (score >= 70) return "#10b981"; // emerald
  if (score >= 55) return "#f59e0b"; // amber
  return "#ef4444";                  // red
}

function DistrictPerformanceChart({
  compact = false,
  tall = false,
}: {
  compact?: boolean;
  tall?: boolean;
}) {
  const isClient = useIsClient();
  const tickSize = compact ? 10 : 12;

  return (
    <DashboardCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden p-4 sm:p-5 ${compact && tall ? "flex h-full min-h-0 flex-col" : ""}`}
    >
      <div
        className={`mb-4 flex gap-2 ${compact ? "flex-col sm:flex-row sm:items-start sm:justify-between" : "items-center justify-between"}`}
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] lg:text-base">
            Sub-District Performance
          </h3>
          {!compact && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Operational score by sub-district (0–100)
            </p>
          )}
        </div>
        <div className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] text-[var(--color-text-secondary)] sm:text-xs">
          FY 2025-26
        </div>
      </div>

      {compact && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
            <p className="text-[10px] text-[var(--color-text-muted)]">Avg Score</p>
            <p className="text-sm font-bold text-teal-400">74.8</p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
            <p className="text-[10px] text-[var(--color-text-muted)]">Below Target</p>
            <p className="text-sm font-bold text-red-400">2</p>
          </div>
        </div>
      )}

      <div
        className={
          compact
            ? tall
              ? "h-[300px] w-full flex-1 sm:h-[320px]"
              : "h-[220px] w-full"
            : "h-[280px] w-full sm:h-[300px]"
        }
      >
        {isClient ? <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={compact ? { top: 8, right: 8, bottom: 0, left: 0 } : { top: 8, right: 8, bottom: 4, left: 4 }}
          >
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="sub"
              tick={{ fill: "var(--color-text-muted)", fontSize: tickSize }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              width={compact ? 32 : 40}
              tick={{ fill: "var(--color-text-muted)", fontSize: tickSize }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                color: "var(--color-text-primary)",
                fontSize: compact ? 11 : 12,
              }}
              formatter={(v) => [`${v}`, "Score"]}
            />
            <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={compact ? 28 : 48}>
              {data.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer> : null}
      </div>
    </DashboardCard>
  );
}

export default React.memo(DistrictPerformanceChart);
