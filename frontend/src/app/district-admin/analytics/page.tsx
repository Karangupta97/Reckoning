"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, ShieldCheck, CheckCircle2, Map } from "lucide-react";
import ComplaintTrendChart from "@/components/district-admin-dashboard/complaint-trend-chart";
import ResolutionRateChart from "@/components/district-admin-dashboard/resolution-rate-chart";
import DistrictPerformanceChart from "@/components/district-admin-dashboard/district-performance-chart";
import SubDistrictPerformance from "@/components/district-admin-dashboard/sub-district-performance";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useDistrictAnalyticsMetrics } from "@/hooks/use-analytics-metrics";
import { MapLoadingSkeleton } from "@/components/map/map-loading-skeleton";
import type { RegionStats } from "@/lib/map/types";

const IndiaMap = dynamic(() => import("@/components/map/IndiaMap"), { ssr: false });

const TABS = [
  { id: "complaint", label: "Complaint Trends",  icon: TrendingUp,   param: "" },
  { id: "sla",       label: "SLA Compliance",    icon: ShieldCheck,  param: "sla" },
  { id: "resolution",label: "Resolution Rates",  icon: CheckCircle2, param: "resolution" },
] as const;

type TabId = typeof TABS[number]["id"];

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const metrics = useDistrictAnalyticsMetrics();
  const [selectedRegion, setSelectedRegion] = useState<RegionStats | null>(null);

  const KPI = [
    { label: "Avg Resolution Time", value: `${metrics.avgResolutionDays}d`, color: "text-teal-400" },
    { label: "SLA Compliance",      value: `${metrics.slaCompliance}%`,     color: "text-emerald-400" },
    { label: "Escalation Rate",     value: `${metrics.escalationRate}%`,    color: "text-amber-400" },
    { label: "Resolution Rate",     value: `${metrics.resolutionRate}%`,    color: "text-cyan-400" },
  ];

  const tabParam = searchParams.get("tab") ?? "";
  const activeTab: TabId =
    tabParam === "sla" ? "sla" :
    tabParam === "resolution" ? "resolution" :
    "complaint";

  const navigate = (param: string) => {
    router.push(param ? `/district-admin/analytics?tab=${param}` : "/district-admin/analytics");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-teal-400 shrink-0" />
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">District Analytics</h1>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Complaint trends, resolution rates, and sub-district performance analysis
        </p>
      </motion.div>

      {/* KPI strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {KPI.map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      {/* Tab bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <DashboardCard className="flex gap-0 overflow-x-auto [scrollbar-width:none] px-2 py-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => navigate(tab.param)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-teal-500/10 text-teal-300 border border-teal-500/20"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border border-transparent"
                }`}>
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </DashboardCard>
      </motion.div>

      {/* Tab content */}
      {activeTab === "complaint" && (
        <motion.div key="complaint" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }} className="flex flex-col gap-4">
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ComplaintTrendChart />
            <ResolutionRateChart />
          </section>
          <DistrictPerformanceChart />
        </motion.div>
      )}

      {activeTab === "sla" && (
        <motion.div key="sla" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }} className="flex flex-col gap-4">
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DistrictPerformanceChart />
            <ResolutionRateChart />
          </section>
          <SubDistrictPerformance />
        </motion.div>
      )}

      {activeTab === "resolution" && (
        <motion.div key="resolution" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }} className="flex flex-col gap-4">
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ResolutionRateChart />
            <ComplaintTrendChart />
          </section>
          <SubDistrictPerformance />
        </motion.div>
      )}

      {/* Geographic Overview Map with Hover Overlay */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <DashboardCard className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-4 pb-3">
            <Map size={16} className="text-teal-400" />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Geographic Overview</h2>
            <span className="ml-auto text-[10px] text-[var(--color-text-muted)]">
              Hover on regions to view stats
            </span>
          </div>
          <div className="relative w-full" style={{ height: "480px" }}>
            <Suspense fallback={<MapLoadingSkeleton />}>
              <IndiaMap
                adminRole="district_admin"
                height="100%"
                showBreadcrumb={true}
                showControls={true}
                showLegend={true}
                showSidebar={true}
                onRegionSelect={(stats) => setSelectedRegion(stats)}
              />
            </Suspense>
          </div>

          {/* Selected Region Summary Strip */}
          {selectedRegion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-[var(--color-border)] px-5 py-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs font-bold text-[var(--color-text-primary)]">{selectedRegion.name}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] capitalize">{selectedRegion.level}</p>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="text-[var(--color-text-secondary)]">
                    📊 <strong>{selectedRegion.totalReports}</strong> Reports
                  </span>
                  <span className="text-red-400">
                    🔴 <strong>{selectedRegion.criticalCount}</strong> Critical
                  </span>
                  <span className="text-amber-400">
                    🟡 <strong>{selectedRegion.highCount}</strong> High
                  </span>
                  <span className="text-emerald-400">
                    🟢 <strong>{selectedRegion.resolvedReports}</strong> Resolved
                  </span>
                  <span className="text-cyan-400">
                    ⏱ <strong>{selectedRegion.avgResolutionDays}d</strong> Avg
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </DashboardCard>
      </motion.div>
    </div>
  );
}

export default function DistrictAnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-teal-400" />
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  );
}
