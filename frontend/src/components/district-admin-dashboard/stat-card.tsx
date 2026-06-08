"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: "up" | "down";
  /** good = teal glow, warn = amber, danger = red */
  variant?: "good" | "warn" | "danger" | "neutral";
}

const glowMap: Record<NonNullable<StatCardProps["variant"]>, string> = {
  good: "border-teal-500/40 bg-teal-500/10 text-teal-400 shadow-[0_0_16px_rgba(20,184,166,0.28)]",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.22)]",
  danger: "border-red-500/40 bg-red-500/10 text-red-400 shadow-[0_0_16px_rgba(239,68,68,0.22)]",
  neutral: "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]",
};

export default function DistrictStatCard({
  title,
  value,
  change,
  icon,
  trend,
  variant = "good",
}: StatCardProps) {
  const isUp = trend === "up";

  return (
    <DashboardCard
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="min-h-[100px] overflow-hidden p-3 sm:min-h-[112px] sm:p-4 lg:min-h-[116px] lg:p-4"
    >
      <div className="flex h-full items-center gap-3 lg:gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 sm:h-12 sm:w-12 lg:h-11 lg:w-11 ${glowMap[variant]}`}
        >
          {icon}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 overflow-hidden">
          <p
            className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-[var(--color-text-secondary)]"
            title={title}
          >
            {title}
          </p>

          <h3 className="overflow-hidden text-ellipsis whitespace-nowrap text-lg font-bold leading-none text-[var(--color-text-primary)] sm:text-xl">
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
            <span className="hidden overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-[var(--color-text-muted)] sm:inline">
              from last month
            </span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
