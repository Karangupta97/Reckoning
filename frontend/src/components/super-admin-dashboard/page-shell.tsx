"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { DashboardCard } from "./dashboard-card";

/**
 * Shared shell for super-admin pages that don't have full implementations yet.
 * Renders a header, optional stat strip, and a "coming soon" content area.
 */
export function PageShell({
  icon: Icon,
  title,
  subtitle,
  color = "text-cyan-400",
  stats,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color?: string;
  stats?: { label: string; value: string; color: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <Icon size={20} className={`${color} shrink-0`} />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
        </div>
      </motion.div>

      {stats && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
              <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
              <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
            </DashboardCard>
          ))}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border"
            style={{ borderColor: "rgba(34,211,238,0.2)", background: "rgba(34,211,238,0.06)" }}>
            <Icon size={28} className="text-cyan-400 opacity-70" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs">
              Full implementation coming soon. Data pipeline and visualisations will appear here.
            </p>
          </div>
          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/8 px-3 py-1 text-[11px] font-medium text-cyan-400">
            Coming Soon
          </span>
        </DashboardCard>
      </motion.div>
    </div>
  );
}
