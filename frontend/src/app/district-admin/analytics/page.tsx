"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, ShieldCheck, CheckCircle2 } from "lucide-react";
import ComplaintTrendChart from "@/components/district-admin-dashboard/complaint-trend-chart";
import ResolutionRateChart from "@/components/district-admin-dashboard/resolution-rate-chart";
import DistrictPerformanceChart from "@/components/district-admin-dashboard/district-performance-chart";
import SubDistrictPerformance from "@/components/district-admin-dashboard/sub-district-performance";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

const TABS = [
  { id: "complaint", label: "Complaint Trends",  icon: TrendingUp,   param: "" },
  { id: "sla",       label: "SLA Compliance",    icon: ShieldCheck,  param: "sla" },
  { id: "resolution",label: "Resolution Rates",  icon: CheckCircle2, param: "resolution" },
] as const;

type TabId = typeof TABS[number]["id"];

const KPI = [
  { label: "Avg Resolution Time", value: "4.2d",  color: "text-teal-400"    },
  { label: "SLA Compliance",      value: "81%",   color: "text-emerald-400" },
  { label: "Escalation Rate",     value: "4.0%",  color: "text-amber-400"   },
  { label: "Citizen Satisfaction",value: "73%",   color: "text-cyan-400"    },
];

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

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
