"use client";

import React from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DashboardCard } from "./dashboard-card";
import { useIsClient } from "@/hooks/useIsClient";

const data = [
  { month: "Jan", complaints: 320 },
  { month: "Feb", complaints: 410 },
  { month: "Mar", complaints: 380 },
  { month: "Apr", complaints: 520 },
  { month: "May", complaints: 610 },
  { month: "Jun", complaints: 580 },
  { month: "Jul", complaints: 700 },
  { month: "Aug", complaints: 760 },
];

const chartMargin = { top: 8, right: 8, bottom: 4, left: 4 };
const chartMarginCompact = { top: 8, right: 8, bottom: 0, left: 0 };

function ComplaintChart({
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
            Complaint Trends
          </h3>
          {!compact && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Monthly complaint registrations across India
            </p>
          )}
        </div>
        <div className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] text-[var(--color-text-secondary)] sm:text-xs">
          Last 8 Months
        </div>
      </div>

      <div
        className={
          compact
            ? tall
              ? "h-[300px] w-full flex-1 sm:h-[320px]"
              : "h-[260px] w-full"
            : "h-[280px] w-full sm:h-[300px]"
        }
      >
        {isClient ? <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
            />
            <Line
              type="monotone"
              dataKey="complaints"
              stroke="#3b82f6"
              strokeWidth={compact ? 2 : 3}
              dot={{ r: compact ? 3 : 4, fill: "#3b82f6" }}
              activeDot={{ r: compact ? 5 : 6 }}
            />
          </LineChart>
        </ResponsiveContainer> : null}
      </div>
    </DashboardCard>
  );
}

export default React.memo(ComplaintChart);
