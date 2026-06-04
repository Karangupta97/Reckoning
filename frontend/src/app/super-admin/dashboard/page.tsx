"use client";

import { Route, AlertTriangle, Wallet, Shield, Users, Clock, BarChart3 } from "lucide-react";

import StatCard from "@/components/super-admin-dashboard/stat-card";
import IndiaMap from "@/components/maps/india-map";
import RiskAlerts from "@/components/super-admin-dashboard/risk-alerts";

import ActivityFeed from "@/components/super-admin-dashboard/activity-feed";
import ComplaintsTable from "@/components/super-admin-dashboard/complaints-table";
import ContractorRiskTable from "@/components/super-admin-dashboard/contractor-risk-table";
import OnboardingRequests from "@/components/super-admin-dashboard/onboarding-requests";

import ComplaintChart from "@/components/charts/complaint-chart";
import ExpenditureChart from "@/components/charts/expenditure-chart";
import DelayedProjectsChart from "@/components/charts/delayed-projects-chart";

export default function SuperAdminDashboard() {
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
      icon: <AlertTriangle size={20} />,
      trend: "up" as const,
      iconColor: "text-red-400",
    },
    {
      title: "Budget Monitored",
      value: "₹842 Cr",
      change: "18.3%",
      icon: <Wallet size={20} />,
      trend: "up" as const,
      iconColor: "text-purple-400",
    },
    {
      title: "Suspicious Projects",
      value: "312",
      change: "9.1%",
      icon: <Shield size={20} />,
      trend: "up" as const,
      iconColor: "text-orange-400",
    },
    {
      title: "Active Admins",
      value: "1,246",
      change: "7.8%",
      icon: <Users size={20} />,
      trend: "up" as const,
      iconColor: "text-emerald-400",
    },
    {
      title: "Avg Resolution Time",
      value: "5.6 Days",
      change: "4.3%",
      icon: <Clock size={20} />,
      trend: "down" as const,
      iconColor: "text-cyan-400",
    },
    {
      title: "Contractor Risk Score",
      value: "68 / 100",
      change: "6.2%",
      icon: <BarChart3 size={20} />,
      trend: "up" as const,
      iconColor: "text-emerald-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI GRID */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiData.map((item, index) => (
          <StatCard key={index} {...item} />
        ))}
      </section>

      {/* INDIA MAP + RISK */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <IndiaMap />
        </div>

        <div className="xl:col-span-4">
          <RiskAlerts />
        </div>
      </section>

      {/* CHARTS */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ExpenditureChart />
        <ContractorRiskTable />
        <ComplaintChart />
      </section>

      {/* DELAYS + COMPLAINTS + ACTIVITY */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-3">
          <DelayedProjectsChart />
        </div>

        <div className="xl:col-span-6">
          <ComplaintsTable />
        </div>

        <div className="xl:col-span-3">
          <ActivityFeed />
        </div>
      </section>

      {/* ADMIN REQUESTS */}
      <section>
        <OnboardingRequests />
      </section>
    </div>
  );
}