"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useIsClient } from "@/hooks/useIsClient";

const data = [
  { name: "Resolved", value: 58 },
  { name: "In Progress", value: 24 },
  { name: "Escalated", value: 12 },
  { name: "Overdue", value: 6 },
];

// Teal / Emerald / Amber / Red palette
const COLORS = ["#14b8a6", "#10b981", "#f59e0b", "#ef4444"];

function ResolutionRateChart({
  compact = false,
}: {
  compact?: boolean;
}) {
  const isClient = useIsClient();
  return (
    <DashboardCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5"
    >
      <div
        className={`mb-4 flex gap-2 ${compact ? "flex-col sm:flex-row sm:items-start sm:justify-between" : "items-center justify-between"}`}
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] lg:text-base">
            Resolution Rate
          </h3>
          {!compact && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Complaint resolution status breakdown
            </p>
          )}
        </div>
        <div className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] text-[var(--color-text-secondary)] sm:text-xs">
          1,240 Total
        </div>
      </div>

      {compact ? (
        <div className="mb-3 flex gap-2">
          <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-center">
            <p className="text-[10px] text-[var(--color-text-muted)]">Resolved</p>
            <p className="text-sm font-bold text-teal-400">58%</p>
          </div>
          <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-center">
            <p className="text-[10px] text-[var(--color-text-muted)]">Overdue</p>
            <p className="text-sm font-bold text-red-400">6%</p>
          </div>
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <p className="text-xs text-[var(--color-text-muted)]">Resolved</p>
            <p className="mt-1 text-lg font-bold text-teal-400">719</p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <p className="text-xs text-[var(--color-text-muted)]">Overdue</p>
            <p className="mt-1 text-lg font-bold text-red-400">74</p>
          </div>
        </div>
      )}

      <div className={compact ? "h-[240px] w-full" : "h-[260px] w-full sm:h-[280px]"}>
        {isClient ? <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={compact ? 44 : 60}
              outerRadius={compact ? 72 : 100}
              paddingAngle={3}
              cx="50%"
              cy={compact ? "42%" : "50%"}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                color: "var(--color-text-primary)",
                fontSize: compact ? 11 : 12,
              }}
              formatter={(v) => [`${v}%`, "Cases"]}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconSize={compact ? 11 : 12}
              wrapperStyle={{
                color: "var(--color-text-secondary)",
                fontSize: compact ? 12 : 13,
                fontWeight: 500,
                paddingTop: compact ? 8 : 10,
              }}
            />
          </PieChart>
        </ResponsiveContainer> : null}
      </div>
    </DashboardCard>
  );
}

export default React.memo(ResolutionRateChart);
