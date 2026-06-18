"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { DashboardCard } from "./dashboard-card";
import { useIsClient } from "@/hooks/useIsClient";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

const legendLabels: Record<string, string> = {
  "Completed": "Done",
  "On Schedule": "On Sched.",
  "Minor Delay": "Minor",
  "Critical Delay": "Critical",
};

/**
 * Project status derived from governance data:
 * - Completed: Budget approved + Funds released + Resolution exists
 * - On Schedule: Budget approved + Funds released (work in progress)
 * - Minor Delay: Budget approved but funds not yet released
 * - Critical Delay: Budget pending/rejected or SLA breached
 */
function DelayedProjectsChart({
  compact = false,
}: {
  compact?: boolean;
}) {
  const isClient = useIsClient();
  const budgets = useBudgetApprovalStore((s) => s.requests);
  const resolutions = useComplaintWorkflowStore((s) => s.resolutions);

  // Derive project statuses from budget + resolution data
  const totalProjects = budgets.length;

  const completed = budgets.filter((b) => {
    if (b.status !== "Approved" || !b.releasedAmount) return false;
    // Check if linked escalation has a resolution
    const hasResolution = b.linkedEscalationIds?.some((escId) =>
      resolutions.some((r) => r.escalationId === escId && r.status === "Approved")
    );
    return hasResolution || b.releaseStatus === "Fully Released";
  }).length;

  const onSchedule = budgets.filter((b) =>
    b.status === "Approved" && b.releasedAmount && b.releaseStatus !== "Fully Released"
  ).length;

  const minorDelay = budgets.filter((b) =>
    b.status === "Approved" && !b.releasedAmount
  ).length;

  const criticalDelay = budgets.filter((b) =>
    b.status === "Pending Approval" || b.status === "Rejected" || b.status === "Under Audit" || b.status === "Sent Back For Review"
  ).length;

  const total = Math.max(1, completed + onSchedule + minorDelay + criticalDelay);
  const data = [
    { name: "Completed", value: Math.round((completed / total) * 100) || (totalProjects === 0 ? 25 : 0) },
    { name: "On Schedule", value: Math.round((onSchedule / total) * 100) || (totalProjects === 0 ? 25 : 0) },
    { name: "Minor Delay", value: Math.round((minorDelay / total) * 100) || (totalProjects === 0 ? 25 : 0) },
    { name: "Critical Delay", value: Math.round((criticalDelay / total) * 100) || (totalProjects === 0 ? 25 : 0) },
  ];

  const delayed = minorDelay + criticalDelay;
  const onTime = completed + onSchedule;

  return (
    <DashboardCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5"
    >
      <div
        className={`mb-4 flex gap-2 ${compact ? "flex-col sm:flex-row sm:items-start sm:justify-between" : "items-center justify-between"}`}
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] lg:text-base">
            Project Status Analysis
          </h3>
          {!compact && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Infrastructure project status derived from budget & resolution data
            </p>
          )}
        </div>
        <div className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] text-[var(--color-text-secondary)] sm:text-xs">
          {totalProjects} Projects
        </div>
      </div>

      {compact ? (
        <div className="mb-3 flex gap-2">
          <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-center">
            <p className="text-[10px] text-[var(--color-text-muted)]">Delayed</p>
            <p className="text-sm font-bold text-red-400">{delayed}</p>
          </div>
          <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-center">
            <p className="text-[10px] text-[var(--color-text-muted)]">On Track</p>
            <p className="text-sm font-bold text-emerald-400">{onTime}</p>
          </div>
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <p className="text-xs text-[var(--color-text-muted)]">Delayed Projects</p>
            <p className="mt-1 text-lg font-bold text-red-400">{delayed}</p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <p className="text-xs text-[var(--color-text-muted)]">On Track</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">{onTime}</p>
          </div>
        </div>
      )}

      <div className={compact ? "h-[240px] w-full" : "h-[260px] w-full sm:h-[280px]"}>
        {isClient ? <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={compact ? 44 : 60}
              outerRadius={compact ? 72 : 100}
              paddingAngle={3}
              cx="50%"
              cy={compact ? "42%" : "50%"}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                color: "var(--color-text-primary)",
                fontSize: compact ? 11 : 12,
              }}
              formatter={(value) => [`${value}%`, "Projects"]}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconSize={compact ? 11 : 12}
              wrapperStyle={{
                color: "var(--color-text-secondary)",
                fontSize: compact ? 12 : 13,
                fontWeight: 500,
                paddingTop: compact ? 8 : 10,
                lineHeight: compact ? "18px" : "20px",
              }}
              formatter={(value) => {
                const label = String(value);
                const short = legendLabels[label] ?? label;
                return (
                  <span style={{ fontSize: compact ? 12 : 13, fontWeight: 500 }}>
                    {compact ? short : label}
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer> : null}
      </div>
    </DashboardCard>
  );
}

export default React.memo(DelayedProjectsChart);
