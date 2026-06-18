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
  const saMetrics = useSuperAdminAnalyticsMetrics();

  const kpiData = [
    {
      title: "Total Complaints",
      value: String(saMetrics.totalComplaints),
      change: `${saMetrics.resolutionRate}% resolved`,
      icon: <Route size={20} />,
      trend: "up" as const,
      iconColor: "text-cyan-400",
    },
    {
      title: "Active Escalations",
      value: String(saMetrics.activeEscalations),
      change: `${saMetrics.slaBreachCount} SLA breaches`,
      icon: <AlertTriangle size={20} />,
      trend: "up" as const,
      iconColor: "text-amber-400",
    },
    {
      title: "Pending Reviews",
      value: String(saMetrics.pendingEvidence + saMetrics.pendingBudgets),
      change: `${saMetrics.pendingEvidence} evidence, ${saMetrics.pendingBudgets} budget`,
      icon: <ShieldAlert size={20} />,
      trend: "up" as const,
      iconColor: "text-red-400",
    },
    {
      title: "Funds Released",
      value: `₹${saMetrics.releasedFunds.toFixed(1)} Cr`,
      change: `${saMetrics.govRequests} governance requests`,
      icon: <Clock size={20} />,
      trend: "down" as const,
      iconColor: "text-cyan-400",
    },
  ];

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
