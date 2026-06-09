"use client";

import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useIsClient } from "@/hooks/useIsClient";

const data = [
  {
    name: "On Schedule",
    value: 62,
  },
  {
    name: "Minor Delay",
    value: 21,
  },
  {
    name: "Major Delay",
    value: 11,
  },
  {
    name: "Critical Delay",
    value: 6,
  },
];

const COLORS = [
  "var(--color-success)",
  "var(--color-info)",
  "var(--color-amber)",
  "var(--color-danger)",
];

export default function DelayedProjectsChart() {
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
            Project Delay Analysis
          </h3>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Status distribution of infrastructure projects
          </p>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
          184 Active Projects
        </div>
      </div>

      {/* KPI Summary */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[var(--color-surface)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            Delayed Projects
          </p>

          <p className="mt-1 text-lg font-bold text-[var(--color-danger)]">
            31
          </p>
        </div>

        <div className="rounded-lg bg-[var(--color-surface)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            On Schedule
          </p>

          <p className="mt-1 text-lg font-bold text-[var(--color-success)]">
            114
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[320px] w-full">
        {isClient ? <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index]}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                color: "var(--color-text-primary)",
              }}
              formatter={(value) => [`${value}%`, "Projects"]}
            />

            <Legend
              wrapperStyle={{
                color: "var(--color-text-secondary)",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer> : null}
      </div>
    </motion.div>
  );
}