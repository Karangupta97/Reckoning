"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { CONTRIBUTION_DATA } from "../mockData";

export function ContributionAnalytics() {
  const [period, setPeriod] = useState<"month" | "year">("month");

  return (
    <div className="neu-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
          Contribution Analytics
        </h3>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as "month" | "year")}
          className="text-xs px-2 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-amber)]"
        >
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <LegendDot color="#3B82F6" label="Submitted" />
        <LegendDot color="#22C55E" label="Verified" />
        <LegendDot color="#F59E0B" label="Resolved" />
      </div>

      {/* Chart */}
      <div className="w-full h-44 sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={CONTRIBUTION_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gradSubmitted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradVerified" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "var(--shadow-neu)",
              }}
              labelStyle={{ color: "var(--color-text-primary)", fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="submitted"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#gradSubmitted)"
              dot={false}
              activeDot={{ r: 4, stroke: "#3B82F6", strokeWidth: 2, fill: "var(--color-card)" }}
            />
            <Area
              type="monotone"
              dataKey="verified"
              stroke="#22C55E"
              strokeWidth={2}
              fill="url(#gradVerified)"
              dot={false}
              activeDot={{ r: 4, stroke: "#22C55E", strokeWidth: 2, fill: "var(--color-card)" }}
            />
            <Area
              type="monotone"
              dataKey="resolved"
              stroke="#F59E0B"
              strokeWidth={2}
              fill="url(#gradResolved)"
              dot={false}
              activeDot={{ r: 4, stroke: "#F59E0B", strokeWidth: 2, fill: "var(--color-card)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-full"
        style={{ background: color }}
      />
      <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">{label}</span>
    </div>
  );
}
