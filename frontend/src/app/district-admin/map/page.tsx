"use client";

import { motion } from "framer-motion";
import IndiaMap from "@/components/map/IndiaMap";
import { Map, Layers } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

const MAP_LEGEND = [
  { label: "Boundary", color: "#14b8a6" },
  { label: "Escalated", color: "#ef4444" },
  { label: "Open", color: "#f59e0b" },
  { label: "Resolved", color: "#10b981" },
  { label: "Heatmap", color: "#06b6d4" },
];

export default function DistrictMapPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center gap-2">
          <Map size={20} className="text-teal-400 shrink-0" />
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
            District Map View
          </h1>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Interactive map showing district boundary, sub-district boundaries, complaint heatmap and escalation hotspots
        </p>
      </motion.div>

      {/* Legend strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <DashboardCard className="flex flex-wrap items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <Layers size={14} className="text-teal-400" />
            <span className="font-medium text-[var(--color-text-secondary)]">Layers:</span>
          </div>
          {MAP_LEGEND.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </DashboardCard>
      </motion.div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="min-w-0"
      >
        <IndiaMap
          adminRole="district_admin"
          height="580px"
          showBreadcrumb
          showControls
          showLegend
          showSidebar
        />
      </motion.div>

      {/* Info cards */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          { label: "Sub-Districts", value: "6", color: "text-teal-400" },
          { label: "Active Zones", value: "4", color: "text-emerald-400" },
          { label: "Hotspots", value: "3", color: "text-red-400" },
          { label: "Coverage", value: "100%", color: "text-cyan-400" },
        ].map((s) => (
          <DashboardCard
            key={s.label}
            className="flex flex-col items-center justify-center py-4 px-3 text-center"
          >
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>
    </div>
  );
}
