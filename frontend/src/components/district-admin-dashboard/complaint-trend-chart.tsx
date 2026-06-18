"use client";

import React from "react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useIsClient } from "@/hooks/useIsClient";

const data = [
  { month: "Jan", complaints: 210, resolved: 180 },
  { month: "Feb", complaints: 285, resolved: 230 },
  { month: "Mar", complaints: 260, resolved: 245 },
  { month: "Apr", complaints: 340, resolved: 290 },
  { month: "May", complaints: 420, resolved: 370 },
  { month: "Jun", complaints: 390, resolved: 360 },
  { month: "Jul", complaints: 480, resolved: 430 },
  { month: "Aug", complaints: 510, resolved: 460 },
];

const chartMargin = { top: 8, right: 8, bottom: 4, left: 4 };
const chartMarginCompact = { top: 8, right: 8, bottom: 0, left: 0 };

/* Custom tooltip — proper light-mode text, red for complaints */
function CustomTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-xs shadow-lg"
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text-primary)",
        minWidth: "130px",
      }}
    >
      <p className="mb-1.5 font-semibold text-[var(--color-text-primary)]">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.color as string }} />
            {entry.dataKey === "complaints" ? "Complaints" : "Resolved"}
          </span>
          <span className="font-bold tabular-nums" style={{ color: entry.color }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ComplaintTrendChart({
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
            Complaint Trend
          </h3>
          {!compact && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Monthly complaints vs. resolutions — district wide
            </p>
          )}
        </div>
        {/* Legend — complaints = red, resolved = emerald */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            Complaints
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Resolved
          </span>
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
          <AreaChart
            data={data}
            margin={compact ? chartMarginCompact : { top: 8, right: 8, bottom: 4, left: 4 }}
          >
            <defs>
              {/* Complaints gradient — red */}
              <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}    />
              </linearGradient>
              {/* Resolved gradient — emerald */}
              <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
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
            <Tooltip content={CustomTooltip} />

            {/* Complaints — red */}
            <Area
              type="monotone"
              dataKey="complaints"
              stroke="#ef4444"
              strokeWidth={compact ? 2 : 2.5}
              fill="url(#redGrad)"
              dot={{ r: compact ? 3 : 4, fill: "#ef4444", strokeWidth: 0 }}
              activeDot={{ r: compact ? 5 : 6, fill: "#ef4444" }}
            />

            {/* Resolved — emerald */}
            <Area
              type="monotone"
              dataKey="resolved"
              stroke="#10b981"
              strokeWidth={compact ? 2 : 2.5}
              fill="url(#emeraldGrad)"
              dot={{ r: compact ? 3 : 4, fill: "#10b981", strokeWidth: 0 }}
              activeDot={{ r: compact ? 5 : 6, fill: "#10b981" }}
            />
          </AreaChart>
        </ResponsiveContainer> : null}
      </div>
    </DashboardCard>
  );
}

export default React.memo(ComplaintTrendChart);
