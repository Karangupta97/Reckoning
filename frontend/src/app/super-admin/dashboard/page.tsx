"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Route, AlertTriangle, Clock, ShieldAlert } from "lucide-react";

import StatCard from "@/components/super-admin-dashboard/stat-card";
import { MapLoadingSkeleton } from "@/components/map/map-loading-skeleton";
import RiskAlerts from "@/components/super-admin-dashboard/risk-alerts";

import ActivityFeed from "@/components/super-admin-dashboard/activity-feed";
import ComplaintsTable from "@/components/super-admin-dashboard/complaints-table";
import ContractorRiskTable from "@/components/super-admin-dashboard/contractor-risk-table";
import OnboardingRequests from "@/components/super-admin-dashboard/onboarding-requests";
import IncomingWorkflowsPanel from "@/components/super-admin-dashboard/incoming-workflows-panel";

import ComplaintChart from "@/components/super-admin-dashboard/complaint-chart";
import ExpenditureChart from "@/components/super-admin-dashboard/expenditure-chart";
import DelayedProjectsChart from "@/components/super-admin-dashboard/delayed-projects-chart";

import { useSuperAdminAnalyticsMetrics } from "@/hooks/use-analytics-metrics";
import { PendingClarificationsWidget } from "@/components/admin/PendingClarificationsWidget";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { shouldUseMock } from "@/lib/useMock";

// Lazy load the map component with no server-side rendering
const IndiaMap = dynamic(() => import("@/components/map/IndiaMap"), {
  ssr: false,
});

function DashboardPair({ children }: { children: ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
      {children}
    </section>
  );
}

function DashboardTriple({ children }: { children: ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:items-stretch">
      {children}
    </section>
  );
}

function CardSlot({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}

export default function SuperAdminDashboard() {
  const currentAdmin = useAdminAuthStore((s) => s.admin);
  const isMock = shouldUseMock(currentAdmin?.email);

  const { data: dbMetrics, isLoading } = useQuery({
    queryKey: ["super-admin-dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/api/super-admin/dashboard/stats");
      return res.data?.data;
    },
    enabled: !isMock,
  });

  const saMetrics = useSuperAdminAnalyticsMetrics();

  const metrics = isMock
    ? saMetrics
    : {
        totalComplaints: dbMetrics?.totalComplaints ?? 0,
        activeEscalations: dbMetrics?.activeEscalations ?? 0,
        pendingEvidence: dbMetrics?.pendingEvidence ?? 0,
        pendingBudgets: dbMetrics?.pendingBudgets ?? 0,
        releasedFunds: dbMetrics?.releasedFunds ?? 0,
        govRequests: dbMetrics?.govRequests ?? 0,
        resolutionRate: dbMetrics?.resolutionRate ?? 0,
        slaBreachCount: dbMetrics?.slaBreachCount ?? 0,
      };

  const kpiData = [
    {
      title: "Total Complaints",
      value: String(metrics.totalComplaints),
      change: `${metrics.resolutionRate}% resolved`,
      icon: <Route size={20} />,
      trend: "up" as const,
      iconColor: "text-cyan-400",
    },
    {
      title: "Active Escalations",
      value: String(metrics.activeEscalations),
      change: `${metrics.slaBreachCount} SLA breaches`,
      icon: <AlertTriangle size={20} />,
      trend: "up" as const,
      iconColor: "text-amber-400",
    },
    {
      title: "Pending Reviews",
      value: String(metrics.pendingEvidence + metrics.pendingBudgets),
      change: `${metrics.pendingEvidence} evidence, ${metrics.pendingBudgets} budget`,
      icon: <ShieldAlert size={20} />,
      trend: "up" as const,
      iconColor: "text-red-400",
    },
    {
      title: "Funds Released",
      value: `₹${metrics.releasedFunds.toFixed(1)} Cr`,
      change: `${metrics.govRequests} governance requests`,
      icon: <Clock size={20} />,
      trend: "down" as const,
      iconColor: "text-cyan-400",
    },
  ];

  if (isLoading && !isMock) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-cyan-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* KPI Cards — above everything */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiData.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </section>

      {/* Incoming Workflows — compact executive panel */}
      <IncomingWorkflowsPanel />

      {/* India Map */}
      <section className="min-w-0">
        <Suspense fallback={<MapLoadingSkeleton />}>
          <IndiaMap adminRole="super_admin" height="480px" />
        </Suspense>
      </section>

      {/* Risk Alerts + Contractor Risk */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-stretch">
        <div className="min-w-0 lg:col-span-5">
          <RiskAlerts />
        </div>
        <div className="min-w-0 lg:col-span-7">
          <ContractorRiskTable />
        </div>
      </section>

      {/* Charts */}
      <DashboardTriple>
        <CardSlot>
          <ComplaintChart compact tall />
        </CardSlot>
        <CardSlot>
          <DelayedProjectsChart compact />
        </CardSlot>
        <CardSlot>
          <ExpenditureChart compact tall />
        </CardSlot>
      </DashboardTriple>

      {/* Complaints + Activity + Clarifications */}
      <section className="grid grid-cols-1 gap-3 xl:grid-cols-12 xl:items-stretch">
        <div className="min-w-0 xl:col-span-7">
          <ComplaintsTable />
        </div>
        <div className="min-w-0 xl:col-span-5 flex flex-col gap-3">
          <PendingClarificationsWidget portal="super" compact />
          <ActivityFeed />
        </div>
      </section>

      {/* Onboarding */}
      <section className="min-w-0">
        <OnboardingRequests />
      </section>
    </div>
  );
}
