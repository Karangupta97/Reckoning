"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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

export default function ComplaintChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="neu-card-lg p-5"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] lg:text-base">
            Complaint Trends
          </h3>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Monthly complaint registrations across India
          </p>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
          Last 8 Months
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
            />

            <Line
              type="monotone"
              dataKey="complaints"
              stroke="var(--color-info)"
              strokeWidth={3}
              dot={{
                r: 4,
                fill: "var(--color-info)",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}