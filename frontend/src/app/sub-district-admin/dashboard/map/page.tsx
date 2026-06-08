"use client";

import { motion } from "framer-motion";
import { Map, Layers, Info } from "lucide-react";
import Link from "next/link";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import IndiaMap from "@/components/map/IndiaMap";

const LEGEND = [
  { label: "Boundary",  color: "#14b8a6" },
  { label: "Escalated", color: "#ef4444" },
  { label: "Open",      color: "#f59e0b" },
  { label: "Resolved",  color: "#10b981" },
  { label: "Heatmap",   color: "#06b6d4" },
];

const mapStats = [
  { label: "Total Complaints",   value: "84",  color: "var(--sda-amber)"      },
  { label: "Critical Zones",     value: "3",   color: "var(--color-danger)"   },
  { label: "Active Tickets",     value: "7",   color: "var(--color-info)"     },
  { label: "Resolved This Week", value: "12",  color: "var(--color-success)"  },
];

export default function MapPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]" aria-label="Breadcrumb">
        <Link href="/sub-district-admin/dashboard" className="hover:text-[var(--color-text-secondary)] transition-colors">
          Dashboard
        </Link>
        <span className="opacity-40">›</span>
        <span className="text-[var(--color-text-secondary)] font-medium">Map View</span>
      </nav>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <Map size={20} className="text-amber-400 shrink-0" />
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">My Zone Map — Panvel Taluka</h1>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          Interactive map showing sub-district boundary, complaint heatmap and escalation hotspots
        </p>
      </motion.div>

      {/* Legend strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <DashboardCard className="flex flex-wrap items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <Layers size={14} className="text-amber-400" />
            <span className="font-medium text-[var(--color-text-secondary)]">Layers:</span>
          </div>
          {LEGEND.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </DashboardCard>
      </motion.div>

      {/* Real interactive map */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="min-w-0">
        <IndiaMap
          adminRole="sub_district_admin"
          height="560px"
          showBreadcrumb
          showControls
          showLegend
          showSidebar
          isDark
        />
      </motion.div>

      {/* Stats bar */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <DashboardCard className="flex flex-wrap items-center gap-6 px-5 py-3">
          {mapStats.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-sm font-black tabular-nums" style={{ color: s.color }}>{s.value}</span>
              <span className="text-xs text-[var(--color-text-muted)]">{s.label}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
            <Info size={12} />
            Click a region to view details
          </div>
        </DashboardCard>
      </motion.div>

      {/* Cluster summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {[
          {
            label: "Top Complaint Clusters",
            items: ["Sector 7 Junction — 5 cases", "Old Panvel Road — 4 cases", "Ward 3 Waterlogging — 3 cases"],
          },
          {
            label: "High Risk Areas",
            items: ["Sector 7 — SLA Breached", "Old Panvel Rd — Critical", "Ward 6 Sewage — Overdue"],
          },
          {
            label: "Recent Activity",
            items: ["CMP-1024 assigned to R. Sharma", "TKT-0501 work in progress", "CMP-1020 resolved ✓"],
          },
        ].map((panel, i) => (
          <DashboardCard
            key={panel.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="p-4"
          >
            <h3 className="text-xs font-bold text-[var(--color-text-primary)] mb-2.5">{panel.label}</h3>
            <div className="flex flex-col gap-1.5">
              {panel.items.map((item, j) => (
                <p key={j} className="text-[11px] text-[var(--color-text-secondary)] flex items-start gap-1.5">
                  <span style={{ color: "var(--sda-amber)" }} className="mt-0.5 shrink-0">•</span>
                  {item}
                </p>
              ))}
            </div>
          </DashboardCard>
        ))}
      </motion.div>
    </div>
  );
}
