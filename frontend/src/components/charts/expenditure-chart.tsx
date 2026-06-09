"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
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

export default function ExpenditureChart() {
  const isClient = useIsClient();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="neu-card-lg p-5"
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] lg:text-base">
            Expenditure Overview
          </h3>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Monthly infrastructure spending (₹ Crores)
          </p>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
          FY 2025-26
        </div>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg bg-[var(--color-surface)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            Total Spend
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
            ₹996 Cr
          </p>
        </div>

        <div className="rounded-lg bg-[var(--color-surface)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            Avg / Month
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
            ₹124 Cr
          </p>
        </div>

        <div className="rounded-lg bg-[var(--color-surface)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            Growth
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--color-success)]">
            +18.4%
          </p>
        </div>

        <div className="rounded-lg bg-[var(--color-surface)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            Forecast
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--color-info)]">
            ₹1.2K Cr
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[320px] w-full">
        {isClient ? <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              stroke="var(--color-border)"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="month"
              tick={{
                fill: "var(--color-text-muted)",
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{
                fill: "var(--color-text-muted)",
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                color: "var(--color-text-primary)",
              }}
              formatter={(value) => [`₹${value} Cr`, "Expenditure"]}
            />

            <Bar
              dataKey="expenditure"
              fill="var(--color-info)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer> : null}
      </div>
    </motion.div>
  );
}