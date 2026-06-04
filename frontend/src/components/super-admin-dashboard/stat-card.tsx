"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: "up" | "down";
  iconColor?: string;
}

export default function StatCard({
  title,
  value,
  change,
  icon,
  trend,
  iconColor = "text-cyan-400",
}: StatCardProps) {
  const isUp = trend === "up";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      className="neu-card h-[120px] overflow-hidden p-4 lg:p-5"
    >
      <div className="flex h-full items-center gap-3 lg:gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 lg:h-14 lg:w-14 ${iconColor}`}
          style={{
            borderColor: "currentColor",
            boxShadow:
              "0 0 16px color-mix(in srgb, currentColor 30%, transparent)",
          }}
        >
          <div className={iconColor}>{icon}</div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 overflow-hidden">
          <p
            className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-[var(--color-text-secondary)]"
            title={title}
          >
            {title}
          </p>

          <h3 className="overflow-hidden text-ellipsis whitespace-nowrap text-xl font-bold leading-none text-[var(--color-text-primary)] lg:text-2xl">
            {value}
          </h3>

          <div className="flex min-w-0 items-center gap-1 overflow-hidden">
            {isUp ? (
              <TrendingUp size={12} className="shrink-0 text-emerald-400" />
            ) : (
              <TrendingDown size={12} className="shrink-0 text-red-400" />
            )}

            <span
              className={`shrink-0 text-xs font-semibold whitespace-nowrap ${
                isUp ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {change}
            </span>

            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[var(--color-text-muted)]">
              from last month
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
