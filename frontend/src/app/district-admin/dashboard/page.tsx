"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";

import {
  DistrictStatCard,
  DistrictHeroBanner,
  ComplaintTrendChart,
  ResolutionRateChart,
  DistrictPerformanceChart,
  EscalationsTable,
  SubDistrictPerformance,
  DistrictActivityFeed,
} from "@/components/district-admin-dashboard";
import { MapLoadingSkeleton } from "@/components/map/map-loading-skeleton";
import { useDistrictDashboardMetrics } from "@/hooks/use-dashboard-metrics";

// Lazy load the map component with no server-side rendering
const IndiaMap = dynamic(() => import("@/components/map/IndiaMap"), {
  ssr: false,
});

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

export default function DistrictAdminDashboard() {
  const d = useDistrictDashboardMetrics();

  const kpiData = [
    {
      title: "Total Complaints",
      value: String(d.totalComplaints),
      change: `${d.newTickets} new tickets`,
      icon: <ClipboardList size={20} />,
      trend: "up" as const,
      variant: "neutral" as const,
    },
    {
      title: "Open Complaints",
      value: String(d.openComplaints),
      change: `${d.resolutionRequests} resolution requests`,
      icon: <AlertTriangle size={20} />,
      trend: "up" as const,
      variant: "warn" as const,
    },
    {
      title: "Resolved Complaints",
      value: String(d.resolvedComplaints),
      change: `${d.evidenceReviews} evidence reviews`,
      icon: <CheckCircle2 size={20} />,
      trend: "down" as const,
      variant: "good" as const,
    },
    {
      title: "Escalated Cases",
      value: String(d.escalatedCases),
      change: `${d.incomingEscalations} incoming`,
      icon: <ShieldAlert size={20} />,
      trend: "up" as const,
      variant: "danger" as const,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Hero Banner */}
      <section className="min-w-0">
        <DistrictHeroBanner />
      </section>

      {/* KPI row */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiData.map((item) => (
          <DistrictStatCard key={item.title} {...item} />
        ))}
      </section>

      {/* Analytics charts */}
      <DashboardTriple>
        <CardSlot>
          <ComplaintTrendChart compact tall />
        </CardSlot>
        <CardSlot>
          <ResolutionRateChart compact />
        </CardSlot>
        <CardSlot>
          <DistrictPerformanceChart compact tall />
        </CardSlot>
      </DashboardTriple>

      {/* District Heatmap */}
      <section className="min-w-0">
        <Suspense fallback={<MapLoadingSkeleton />}>
          <IndiaMap
            adminRole="district_admin"
            height="520px"
            showBreadcrumb
            showControls
            showLegend
            showSidebar
            isDark
          />
        </Suspense>
      </section>

      {/* Tables row — both cards stretch to match each other's height */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:items-stretch">
        <div className="min-w-0 xl:col-span-7 xl:flex xl:flex-col">
          <EscalationsTable />
        </div>
        <div className="min-w-0 xl:col-span-5 xl:flex xl:flex-col">
          <DistrictActivityFeed />
        </div>
      </section>

      {/* Sub-district performance */}
      <section className="min-w-0 pt-1">
        <SubDistrictPerformance />
      </section>
    </div>
  );
}
