"use client";

import type { ReactNode } from "react";
import { Route, AlertTriangle, Clock, ShieldAlert } from "lucide-react";

import StatCard from "@/components/super-admin-dashboard/stat-card";
import IndiaMap from "@/components/maps/india-map";
import RiskAlerts from "@/components/super-admin-dashboard/risk-alerts";

import ActivityFeed from "@/components/super-admin-dashboard/activity-feed";
import ComplaintsTable from "@/components/super-admin-dashboard/complaints-table";
import ContractorRiskTable from "@/components/super-admin-dashboard/contractor-risk-table";
import OnboardingRequests from "@/components/super-admin-dashboard/onboarding-requests";

import ComplaintChart from "@/components/super-admin-dashboard/complaint-chart";
import ExpenditureChart from "@/components/super-admin-dashboard/expenditure-chart";
import DelayedProjectsChart from "@/components/super-admin-dashboard/delayed-projects-chart";

const kpiData = [
  {
    title: "Total Roads Monitored",
    value: "2,45,678",
    change: "8.2%",
    icon: <Route size={20} />,
    trend: "up" as const,
    iconColor: "text-cyan-400",
  },
  {
    title: "Active Complaints",
    value: "14,230",
    change: "12.5%",
    icon: <AlertTriangle size={20} />,
    trend: "up" as const,
    iconColor: "text-amber-400",
  },
  {
    title: "High Risk Roads",
    value: "1,280",
    change: "15.7%",
    icon: <ShieldAlert size={20} />,
    trend: "up" as const,
    iconColor: "text-red-400",
  },
  {
    title: "Avg Resolution Time",
    value: "5.6 Days",
    change: "4.3%",
    icon: <Clock size={20} />,
    trend: "down" as const,
    iconColor: "text-cyan-400",
  },
] as const;

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
  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiData.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </section>

      <section className="min-w-0">
        <IndiaMap />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
        <div className="min-w-0 lg:col-span-5">
          <RiskAlerts />
        </div>
        <div className="min-w-0 lg:col-span-7">
          <ContractorRiskTable />
        </div>
      </section>

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

      {/* Align complaints width with chart row (ends ~project-delay / On Sched. column) */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:items-stretch">
        <div className="min-w-0 xl:col-span-7">
          <ComplaintsTable />
        </div>
        <div className="min-w-0 xl:col-span-5">
          <ActivityFeed />
        </div>
      </section>

      <section className="min-w-0 pt-1">
        <OnboardingRequests />
      </section>
    </div>
  );
}
