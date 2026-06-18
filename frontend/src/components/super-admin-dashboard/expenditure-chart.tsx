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
} from "recharts";
import { DashboardCard } from "./dashboard-card";
import { useIsClient } from "@/hooks/useIsClient";

const data = [
  { month: "Jan", expenditure: 82 },
  { month: "Feb", expenditure: 95 },
  { month: "Mar", expenditure: 110 },
  { month: "Apr", expenditure: 125 },
  { month: "May", expenditure: 118 },
  { month: "Jun", expenditure: 142 },
  { month: "Jul", expenditure: 156 },
  { month: "Aug", expenditure: 168 },
];

const chartMargin = { top: 8, right: 8, bottom: 4, left: 4 };
const chartMarginCompact = { top: 8, right: 8, bottom: 0, left: 0 };

function ExpenditureChart({
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
            Expenditure Overview
          </h3>
          {!compact && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Monthly infrastructure spending (₹ Crores)
            </p>
          )}
        </div>
        <div className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] text-[var(--color-text-secondary)] sm:text-xs">
          FY 2025-26
        </div>
      </div>

      {compact ? (
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
            <p className="text-[10px] text-[var(--color-text-muted)]">Total</p>
            <p className="text-sm font-bold text-[var(--color-text-primary)]">
              ₹996 Cr
            </p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
            <p className="text-[10px] text-[var(--color-text-muted)]">Growth</p>
            <p className="text-sm font-bold text-emerald-400">+18.4%</p>
          </div>
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <p className="text-xs text-[var(--color-text-muted)]">Total Spend</p>
            <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
              ₹996 Cr
            </p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <p className="text-xs text-[var(--color-text-muted)]">Avg / Month</p>
            <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
              ₹124 Cr
            </p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <p className="text-xs text-[var(--color-text-muted)]">Growth</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">+18.4%</p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <p className="text-xs text-[var(--color-text-muted)]">Forecast</p>
            <p className="mt-1 text-lg font-bold text-blue-400">₹1.2K Cr</p>
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
            margin={compact ? chartMarginCompact : chartMargin}
          >
            <CartesianGrid
              stroke="var(--color-border)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--color-text-muted)", fontSize: tickSize }}
              axisLine={false}
              tickLine={false}
              interval={compact ? 1 : 0}
            />
            <YAxis
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
              formatter={(value) => [`₹${value} Cr`, "Expenditure"]}
            />
            <Bar
              dataKey="expenditure"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
              maxBarSize={compact ? 28 : 48}
            />
          </BarChart>
        </ResponsiveContainer> : null}
      </div>
    </DashboardCard>
  );
}

export default React.memo(ExpenditureChart);
