"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Eye, MapPin, FileText, Shield } from "lucide-react";
import type { UserStats } from "@/components/my-reports/types";

interface CommunityImpactProps {
  stats?: UserStats;
  isLoading?: boolean;
}

/**
 * CommunityImpact — Shows real governance impact metrics for the citizen.
 * Derived from the authenticated user's stats fetched from the backend.
 */
export function CommunityImpact({ stats, isLoading }: CommunityImpactProps) {
  const metrics = useMemo(() => {
    if (!stats) {
      return [
        { label: "Issues Resolved", value: "0", icon: CheckCircle2, color: "#22c55e" },
        { label: "Total Reports", value: "0", icon: FileText, color: "#f59e0b" },
        { label: "Roads Improved", value: "0", icon: MapPin, color: "#3b82f6" },
        { label: "Total Views", value: "0", icon: Eye, color: "#8b5cf6" },
        { label: "Safety Score", value: "0/100", icon: Shield, color: "#f59e0b" },
      ];
    }

    const safetyScore = Math.min(
      100,
      Math.max(0, Math.round(stats.resolutionRate * 0.7 + stats.rankPercentile * 0.3)),
    );

    return [
      { label: "Issues Resolved", value: String(stats.resolvedReports), icon: CheckCircle2, color: "#22c55e" },
      { label: "Total Reports", value: String(stats.totalReports), icon: FileText, color: "#f59e0b" },
      { label: "Roads Improved", value: String(stats.resolvedReports), icon: MapPin, color: "#3b82f6" },
      { label: "Total Views", value: String(stats.totalViews), icon: Eye, color: "#8b5cf6" },
      { label: "Safety Score", value: `${safetyScore}/100`, icon: Shield, color: safetyScore >= 70 ? "#22c55e" : "#f59e0b" },
    ];
  }, [stats]);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Community Impact</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="neu-card p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  {m.label}
                </span>
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${m.color} 15%, transparent)`,
                    color: m.color,
                  }}
                >
                  <Icon size={16} strokeWidth={2} />
                </span>
              </div>

              <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-bold text-[var(--color-text-primary)]">
                  {isLoading ? "—" : m.value}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
