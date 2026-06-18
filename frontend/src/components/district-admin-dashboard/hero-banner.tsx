"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Map, MapPin } from "lucide-react";
import Link from "next/link";
import {
  DISTRICT_CONFIG,
  districtOpsCenter,
  districtLocationLabel,
} from "@/lib/district-config";
import { useDistrictDashboardMetrics } from "@/hooks/use-dashboard-metrics";

export default function DistrictHeroBanner() {
  const { subDistrictCount, activeOfficers } = DISTRICT_CONFIG;
  const d = useDistrictDashboardMetrics();

  const metrics = [
    { label: "Critical Escalations", value: String(d.criticalEscalations), color: "text-red-400", border: "border-red-400/20", bg: "bg-red-400/5" },
    { label: "SLA Compliance", value: `${d.slaCompliance}%`, color: "text-teal-400", border: "border-teal-400/20", bg: "bg-teal-400/5" },
    { label: "Sub-Districts", value: String(subDistrictCount), color: "text-cyan-400", border: "border-cyan-400/20", bg: "bg-cyan-400/5" },
    { label: "Active Officers", value: String(activeOfficers), color: "text-emerald-400", border: "border-emerald-400/20", bg: "bg-emerald-400/5" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-[1.25rem] border border-teal-500/20"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in srgb, #14b8a6 8%, var(--color-card)) 0%, color-mix(in srgb, #10b981 5%, var(--color-card)) 50%, color-mix(in srgb, #06b6d4 4%, var(--color-card)) 100%)",
      }}
    >
      {/* Decorative glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: "#14b8a6" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full opacity-[0.06] blur-3xl"
        style={{ background: "#06b6d4" }}
      />

      {/* Scan-line texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
        }}
      />

      <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left — identity + title + description + metrics */}
        <div className="min-w-0 flex-1">
          {/* Two-pill identity row */}
          <div className="mb-4 flex flex-wrap items-center gap-2">

            {/* Live Operations pill */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
              style={{
                background: "color-mix(in srgb, #14b8a6 15%, var(--color-surface))",
                border: "1px solid color-mix(in srgb, #14b8a6 40%, transparent)",
                boxShadow: "0 0 12px color-mix(in srgb, #14b8a6 20%, transparent)",
              }}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
              </span>
              <span
                className="text-[11px] font-bold uppercase tracking-[0.1em]"
                style={{ color: "var(--color-text-primary)" }}
              >
                Live Operations
              </span>
            </div>

            {/* Location pill */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
              style={{
                background: "color-mix(in srgb, #06b6d4 12%, var(--color-surface))",
                border: "1px solid color-mix(in srgb, #06b6d4 35%, transparent)",
                boxShadow: "0 0 10px color-mix(in srgb, #06b6d4 15%, transparent)",
              }}
            >
              <MapPin size={11} className="shrink-0 text-teal-500 dark:text-teal-400" />
              <span
                className="text-[11px] font-semibold tracking-wide"
                style={{ color: "var(--color-text-primary)" }}
              >
                {districtLocationLabel}
              </span>
            </div>

          </div>

          {/* Title */}
          <h2 className="text-xl font-bold leading-tight text-[var(--color-text-primary)] sm:text-2xl">
            {districtOpsCenter}
          </h2>

          {/* Description */}
          <p className="mt-2 max-w-xl text-sm text-[var(--color-text-secondary)]">
            Monitor complaints, escalations, SLA compliance, and operational
            performance across all sub-districts in{" "}
            <span className="font-medium text-teal-400">
              {DISTRICT_CONFIG.name}
            </span>
            .
          </p>

          {/* Operational metrics strip */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                className={`flex flex-col rounded-xl border px-3 py-2 ${m.border} ${m.bg}`}
              >
                <span className={`text-lg font-bold leading-none ${m.color}`}>
                  {m.value}
                </span>
                <span className="mt-1 text-[10px] font-medium text-[var(--color-text-muted)]">
                  {m.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right — CTA buttons */}
        <div className="flex shrink-0 flex-wrap gap-3 lg:flex-col lg:items-end lg:pt-1">
          <Link
            href="/district-admin/dashboard/escalation"
            className="da-btn-primary flex items-center gap-2 !no-underline"
          >
            <ShieldAlert size={16} aria-hidden />
            View Escalations
          </Link>
          <Link
            href="/district-admin/map"
            className="da-btn-secondary flex items-center gap-2 !no-underline"
          >
            <Map size={16} aria-hidden />
            Open Map
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
