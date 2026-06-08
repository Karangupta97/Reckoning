"use client";

import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardCard } from "./dashboard-card";

type RiskLevel = "critical" | "high" | "moderate" | "low";

interface Contractor {
  id: string;
  name: string;
  state: string;
  projects: number;
  riskScore: number;
}

const contractors: Contractor[] = [
  {
    id: "CTR-101",
    name: "L&T Infrastructure",
    state: "Maharashtra",
    projects: 18,
    riskScore: 92,
  },
  {
    id: "CTR-102",
    name: "NCC Limited",
    state: "Karnataka",
    projects: 11,
    riskScore: 81,
  },
  {
    id: "CTR-103",
    name: "Afcons Infrastructure",
    state: "Delhi",
    projects: 9,
    riskScore: 65,
  },
  {
    id: "CTR-104",
    name: "IRB Infrastructure",
    state: "Tamil Nadu",
    projects: 14,
    riskScore: 58,
  },
  {
    id: "CTR-105",
    name: "GMR Projects",
    state: "Gujarat",
    projects: 7,
    riskScore: 44,
  },
];

function getRiskLevel(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "moderate";
  return "low";
}

function getRiskStatusLabel(level: RiskLevel): string {
  switch (level) {
    case "critical":
      return "Critical";
    case "high":
      return "High Risk";
    case "moderate":
      return "Moderate";
    case "low":
      return "Low Risk";
  }
}

const riskBadgeClass: Record<RiskLevel, string> = {
  critical: "dashboard-table-badge-risk-critical",
  high: "dashboard-table-badge-risk-high",
  moderate: "dashboard-table-badge-risk-moderate",
  low: "dashboard-table-badge-risk-low",
};

const riskBarFillClass: Record<RiskLevel, string> = {
  critical: "dashboard-table-risk-bar-fill-critical",
  high: "dashboard-table-risk-bar-fill-high",
  moderate: "dashboard-table-risk-bar-fill-moderate",
  low: "dashboard-table-risk-bar-fill-low",
};

export default function ContractorRiskTable() {
  const router = useRouter();
  return (
    <DashboardCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5"
    >
      <div className="dashboard-table-header">
        <div>
          <h3 className="text-primary text-sm font-semibold lg:text-base">
            Contractor Risk Analysis
          </h3>
          <p className="text-muted mt-1 text-xs">
            AI-generated contractor risk assessment
          </p>
        </div>
        <button type="button" onClick={() => router.push("/super-admin/contractors/risk")} className="btn-secondary shrink-0 !h-9 !px-3 !text-xs">
          Full Report
        </button>
      </div>

      <div className="dashboard-table-scroll">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th className="dashboard-table-th">Contractor</th>
              <th className="dashboard-table-th">State</th>
              <th className="dashboard-table-th">Projects</th>
              <th className="dashboard-table-th">Risk Score</th>
              <th className="dashboard-table-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {contractors.map((contractor, index) => {
              const riskLevel = getRiskLevel(contractor.riskScore);
              const statusLabel = getRiskStatusLabel(riskLevel);

              return (
                <motion.tr
                  key={contractor.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.04 }}
                  className="dashboard-table-row"
                >
                  <td className="dashboard-table-td">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="dashboard-table-contractor-icon">
                        <ShieldAlert size={16} aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="dashboard-table-td-primary truncate text-sm">
                          {contractor.name}
                        </p>
                        <p className="dashboard-table-td-mono truncate text-[11px]">
                          {contractor.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="dashboard-table-td whitespace-nowrap">
                    {contractor.state}
                  </td>
                  <td className="dashboard-table-td dashboard-table-td-primary tabular-nums">
                    {contractor.projects}
                  </td>
                  <td className="dashboard-table-td">
                    <div className="dashboard-table-risk-cell">
                      <div className="dashboard-table-risk-meta">
                        <span
                          className={`dashboard-table-badge dashboard-table-badge-risk-score ${riskBadgeClass[riskLevel]}`}
                        >
                          {contractor.riskScore}
                        </span>
                        <span className="text-muted text-[10px] uppercase tracking-wide">
                          / 100
                        </span>
                      </div>
                      <div
                        className="dashboard-table-risk-bar"
                        role="progressbar"
                        aria-valuenow={contractor.riskScore}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Risk score ${contractor.riskScore}`}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${contractor.riskScore}%` }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          className={`dashboard-table-risk-bar-fill ${riskBarFillClass[riskLevel]}`}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="dashboard-table-td">
                    <span
                      className={`dashboard-table-badge ${riskBadgeClass[riskLevel]}`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
